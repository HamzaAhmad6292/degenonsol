# Visual Memory & Face-Based Identity — Implementation

> Companion to `requirements-visual-memory.md`. This document describes the **complete technical design** for implementing face-based identity, persistent conversation memory, and agent-driven name detection in the Next.js app.

---

## 1. Design Philosophy

The original implementation draft scattered logic across too many endpoints (`/api/face/identify`, `/api/face/register`, `/api/face/name-detect`, `/api/face/greeting`) and left the client responsible for orchestrating multi-step flows. This created unnecessary round-trips, harder debugging, and split concerns that belong together on the server.

**The redesign collapses this into two endpoints:**

- `POST /api/face/session` — the single entry point for everything face-related (detect, identify or register, generate greeting, return conversation context).
- `POST /api/chat/stream` — the existing chat endpoint, extended to persist messages and run the name-detection agent inline.

Everything else (name detection, greeting generation, embedding lookup, conversation resolution) runs as **internal logic inside the agent** on the server. The client just calls two endpoints and reacts to their results.

---

## 2. Architecture

```
Client (React / Next.js)
│
│  1. Camera frame captured once per "face visible" event
│  ├─► POST /api/face/session   ──► FaceAgent (server)
│  │       returns: userId, isNew, displayName,
│  │                greeting, conversationId, recentMessages
│  │
│  2. Otter speaks greeting (TTS), seeds chat UI
│  │
│  3. User messages sent as before
│  └─► POST /api/chat/stream    ──► ChatAgent (server)
│          (userId + conversationId attached)
│          → persists messages
│          → runs NameAgent inline after each assistant turn
│          → streams reply + optional name_stored event
│
Server (Next.js API Routes)
│
├── /api/face/session
│     FaceAgent:
│       step 1: face detection + embedding (server-side)
│       step 2: vector similarity search → identify or register
│       step 3: load or create conversation
│       step 4: generate greeting (LLM call)
│       returns everything the client needs in one response
│
├── /api/chat/stream
│     ChatAgent:
│       step 1: load conversation from DB (seed from recentMessages if new session)
│       step 2: call LLM, stream reply
│       step 3: persist user + assistant messages
│       step 4: run NameAgent inline (when userId set, displayName null)
│       streams: SSE tokens + optional { type: "name_stored", name } event
│
└── Internal (not exposed as HTTP)
      NameAgent     — LLM structured output, detects name in context
      GreetingAgent — LLM call, produces 1-2 sentence otter greeting

Database (Supabase — Postgres + pgvector)
  face_users       → one row per identity
  face_embeddings  → one or more vectors per identity
  conversations    → one per user (or per session if preferred)
  messages         → all turns, ordered by created_at
```

---

## 3. Database Schema

### Enable pgvector

```sql
create extension if not exists vector;
```

### Tables

```sql
-- One row per recognized face identity
create table face_users (
  id           uuid primary key default gen_random_uuid(),
  display_name text,               -- null until NameAgent sets it
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- One or more face vectors per user
create table face_embeddings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references face_users(id) on delete cascade,
  embedding  vector(512),          -- dimension must match your face model
  created_at timestamptz default now()
);

create index on face_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- One conversation per user (or per session — see note below)
create table conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references face_users(id) on delete set null, -- null = anonymous
  created_at timestamptz default now()
);

-- All messages for continuity
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content         text not null,
  created_at      timestamptz default now()
);

create index on messages (conversation_id, created_at);
```

**Note on conversations:** For simplicity, maintain **one active conversation per user** (the most recent one). If you later want per-session conversations, add a `session_id` column; the rest of the logic is unchanged.

---

## 4. The Two Endpoints

### 4.1 `POST /api/face/session`

This is the **single entry point** for all face-related setup. The client calls it once when a face becomes visible. It handles everything internally and returns what the client needs to start the session.

**Request:**
```ts
{
  frameData: string;   // base64 data URL from captureCurrentCameraFrame()
}
```

**Response:**
```ts
{
  status: "identified" | "registered" | "no_face";
  userId: string | null;
  displayName: string | null;
  isNewUser: boolean;
  greeting: string | null;          // otter's first message, ready to speak via TTS
  conversationId: string | null;    // use this for all subsequent chat messages
  recentMessages: {                 // last N messages for returning users (seed chat UI)
    role: "user" | "assistant";
    content: string;
  }[];
}
```

**Server flow (inside the FaceAgent):**

```
1. Run face detection on frameData (server-side)
   → if no face detected: return { status: "no_face", ... nulls }
   → if multiple faces: pick largest bounding box (primary-face policy)

2. Compute face embedding from the detected face crop

3. Vector search in face_embeddings (cosine similarity)
   → if best match distance < SIMILARITY_THRESHOLD (e.g. 0.25): IDENTIFIED
       load face_users row (userId, displayName)
       isNewUser = false
   → else: REGISTER
       insert face_users (display_name = null)
       insert face_embeddings (user_id, embedding)
       userId = new row id
       displayName = null
       isNewUser = true

4. Resolve conversation
   → SELECT from conversations WHERE user_id = userId ORDER BY created_at DESC LIMIT 1
   → if none exists: INSERT new conversation, conversationId = new id
   → else: conversationId = existing id

5. Load recent messages (for returning users)
   → SELECT last 20 messages WHERE conversation_id = conversationId ORDER BY created_at ASC
   → if isNewUser: recentMessages = []

6. Generate greeting (GreetingAgent — internal LLM call)
   → prompt: see Section 6.2
   → returns: one or two sentence string
   → greeting = result

7. Return full response object
```

No separate `/api/face/identify`, `/api/face/register`, or `/api/face/greeting` endpoints. All of that is internal to this one handler.

---

### 4.2 `POST /api/chat/stream` (extended)

The existing chat endpoint, extended with two additions: message persistence and inline name detection. No breaking change — if `userId` is absent, behavior is identical to today.

**New fields accepted in request body:**
```ts
{
  // existing fields unchanged
  message: string;
  conversationId: string;
  mood?: string;
  trend?: string;
  lifecycleStage?: string;
  frameData?: string;

  // new optional fields
  userId?: string;           // if set, enables persistence + name detection
}
```

**Extended server flow:**

```
1. If userId is set:
   a. Load conversation messages from DB (last 30) → seed the in-memory history
      (replaces ephemeral in-memory Map for this session)
   b. Inject system prompt additions:
      - if displayName known: "The user's name is [name]. Use it naturally."
      - if displayName null:  "You don't know the user's name yet. Ask naturally once."

2. Call LLM, stream tokens to client (same as today)

3. After stream complete, if userId is set:
   a. Persist user message → INSERT into messages
   b. Persist assistant reply → INSERT into messages

4. Run NameAgent inline (see Section 6.1):
   - Only when: userId is set AND face_users.display_name IS NULL
   - Input: last user message + last 6 turns from DB
   - If NameAgent returns { nameProvided: true, name: "X" }:
       UPDATE face_users SET display_name = 'X', updated_at = now() WHERE id = userId
       Send SSE event: { type: "name_stored", name: "X" }

5. Close stream
```

The NameAgent call happens **after** the stream is sent to the client, so it never blocks the response. The `name_stored` event arrives as a final SSE frame.

---

## 5. Internal Agents

These are **not HTTP endpoints** — they are plain async functions called from within the two API routes. This is the "agent framework": each agent has a single responsibility, receives structured input, and returns structured output. They are easy to unit test and replace independently.

### 5.1 NameAgent

```ts
// src/agents/nameAgent.ts

export type NameAgentResult = {
  nameProvided: boolean;
  name: string | null;
};

export async function detectName(
  userMessage: string,
  recentTurns: { role: "user" | "assistant"; content: string }[]
): Promise<NameAgentResult>
```

**Prompt design:**

System:
> You are a classifier with one job: determine whether the user has just provided the name they want to be called. Consider the full conversation context — for example, if the assistant recently asked "What should I call you?" and the user responded, that response likely contains their name. Do not apply rules or patterns. Use contextual understanding. Output ONLY valid JSON matching the schema.

User:
> Recent conversation:
> [recentTurns as JSON]
>
> User's latest message: "[userMessage]"
>
> Did the user provide a name they want to be called? If yes, what is that name (trim whitespace, title-case)?

**Structured output** (OpenAI `response_format: { type: "json_schema" }`):
```json
{
  "nameProvided": true,
  "name": "Alex"
}
```

**Rules:**
- Never regex or template-match in application code — the LLM decides.
- If `nameProvided` is false or `name` is null/empty, do nothing.
- Model: use the same model as chat (e.g. `gpt-4o-mini`). This call is cheap; it's just classification.

---

### 5.2 GreetingAgent

```ts
// src/agents/greetingAgent.ts

export async function generateGreeting(params: {
  isNewUser: boolean;
  displayName: string | null;
  recentMessages: { role: string; content: string }[];
}): Promise<string>
```

**Prompt design:**

System:
> You are the $DEGEN Otter — a lively, friendly otter who speaks first whenever a face is recognized. Keep your greeting to 1–2 sentences. No emojis. Speak naturally, not like a customer service bot.

User (returning user with name):
> The user's name is [name]. Their last conversation included: [last 2–3 message summaries]. Generate a warm welcome-back greeting.

User (returning user, no name):
> This user has been here before but hasn't shared their name. Generate a friendly welcome-back without using a name.

User (new user):
> This is a new user. Generate a warm greeting and naturally ask what they'd like to be called.

**Result:** a plain string, no special formatting, ready for TTS.

---

### 5.3 FacePipeline

```ts
// src/agents/facePipeline.ts

export type FaceResult =
  | { detected: false }
  | { detected: true; embedding: number[] };

export async function detectAndEmbed(frameData: string): Promise<FaceResult>
```

This wraps whatever face API you choose. All callers receive a normalized `embedding: number[]`. To swap the face provider later, only this file changes.

**Recommended approach:** call an external face recognition API (e.g. CompreFace self-hosted, or AWS Rekognition) that returns a face embedding vector. The dimension must match `vector(512)` in the DB (or adjust the schema if your model outputs a different dimension).

**Multiple-face policy:** Implemented here — if the API returns multiple faces, pick the one with the largest bounding box. Return that face's embedding only.

---

## 6. Client Implementation

### 6.1 State

```ts
type IdentityState = {
  userId: string | null;
  displayName: string | null;
  conversationId: string | null;
  isNewUser: boolean;
  sessionReady: boolean;   // true after /api/face/session returns identified or registered
};
```

Initialize all fields as null/false.

### 6.2 Face Session Flow (once per "face appeared")

```ts
// Throttle: call this at most once per session (per page load).
// Use a ref: if sessionReady === true, do not call again.

async function startFaceSession(frameData: string) {
  const res = await fetch("/api/face/session", {
    method: "POST",
    body: JSON.stringify({ frameData }),
  });
  const data = await res.json();

  if (data.status === "no_face") return;

  // 1. Set identity state
  setIdentity({
    userId: data.userId,
    displayName: data.displayName,
    conversationId: data.conversationId,
    isNewUser: data.isNewUser,
    sessionReady: true,
  });

  // 2. Seed chat UI with history (returning users)
  if (data.recentMessages.length > 0) {
    setChatMessages(data.recentMessages);
  }

  // 3. Otter speaks first
  appendAssistantMessage(data.greeting);
  playTTS(data.greeting);   // existing TTS pipeline
}
```

Call `startFaceSession` from the camera component when a face is first detected. Once `sessionReady` is true, do not call again until next page load.

### 6.3 Chat Messages

Pass `userId` and `conversationId` alongside every chat message:

```ts
await fetch("/api/chat/stream", {
  method: "POST",
  body: JSON.stringify({
    message,
    conversationId: identity.conversationId,
    userId: identity.userId,   // new field — null if anonymous
    mood,
    trend,
    // ...other existing fields
  }),
});
```

Handle the `name_stored` SSE event:

```ts
if (event.type === "name_stored") {
  setIdentity(prev => ({ ...prev, displayName: event.name }));
  // Optional: show a small toast "Got it, I'll call you Alex!"
}
```

### 6.4 No Face → Anonymous

If `startFaceSession` never runs (camera off, no face detected), `userId` and `conversationId` remain null, and the chat behaves exactly as today. No change in anonymous behavior.

---

## 7. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=    # server-side only, never expose to client

# Face API (whichever you choose)
FACE_API_URL=
FACE_API_KEY=

# OpenAI (existing)
OPENAI_API_KEY=

# Tuning
FACE_SIMILARITY_THRESHOLD=0.25   # cosine distance; tune per model
FACE_DETECTION_CONFIDENCE=0.80   # minimum confidence to treat as "face present"
```

Never expose `SUPABASE_SERVICE_ROLE_KEY` or `FACE_API_KEY` to the client. All DB and face API calls happen server-side only.

---

## 8. File Structure

```
src/
  agents/
    facePipeline.ts      # detectAndEmbed() — face detection + embedding
    nameAgent.ts         # detectName() — LLM name classifier
    greetingAgent.ts     # generateGreeting() — LLM greeting generator
  lib/
    db.ts                # Supabase client (server-side)
    faceDb.ts            # DB helpers: findMatchingUser, registerUser,
                         #   getOrCreateConversation, getRecentMessages,
                         #   persistMessage, updateDisplayName
  app/api/
    face/session/
      route.ts           # POST /api/face/session
    chat/stream/
      route.ts           # POST /api/chat/stream (extended)
```

Keep agents and DB helpers in separate files. This makes each piece independently testable and easy to debug — if name detection misfires, you test `nameAgent.ts` in isolation. If greeting feels wrong, you adjust `greetingAgent.ts` independently.

---

## 9. Implementation Order

**Phase 1 — Database + face pipeline**
- Create Supabase project, run migration SQL above.
- Implement `facePipeline.ts` with your chosen face API. Test: send a frame, get back an embedding vector.
- Implement `faceDb.ts` helpers. Test each function independently.

**Phase 2 — `/api/face/session`**
- Wire up the full FaceAgent flow using the helpers from Phase 1.
- Implement `greetingAgent.ts`.
- Test end-to-end: POST a frame, get back a greeting, verify DB rows created.

**Phase 3 — Extended `/api/chat/stream`**
- Add `userId` + `conversationId` handling, message persistence, and NameAgent integration.
- Implement `nameAgent.ts`. Test with mock conversations where the user states their name.
- Verify `name_stored` SSE event fires and DB updates correctly.

**Phase 4 — Client**
- Add `startFaceSession` call in the camera component (throttled, once per page load).
- Pass `userId`/`conversationId` in chat fetch.
- Handle `name_stored` event, update display name in state.
- Seed chat UI with `recentMessages` for returning users.
- Play greeting via TTS.

**Phase 5 — Tuning**
- Adjust `FACE_SIMILARITY_THRESHOLD` based on real-world testing.
- Adjust `FACE_DETECTION_CONFIDENCE` to reduce false triggers.
- Test NameAgent with edge cases (user deflects, gives partial name, changes name later).

---

## 10. Edge Cases

| Scenario | Behavior |
|---|---|
| No face in frame | `/api/face/session` returns `no_face`; client ignores it; anonymous chat |
| Multiple faces | FacePipeline picks largest bounding box; session tied to that identity |
| User never says name | Identity row exists without `display_name`; otter continues without a name; may ask naturally in later turns |
| Wrong person recognized (false positive) | Threshold tuning mitigates; out of scope for this doc |
| User says "call me X instead" | NameAgent detects the new name; `UPDATE face_users SET display_name = 'X'` |
| Camera turns on mid-conversation | `startFaceSession` runs once when face appears; if already `sessionReady`, skip |
| Anonymous → face recognized mid-session | Call `startFaceSession`, get identity + conversationId; transition chat to persistent mode from that point |

---

## 11. Summary

| Before | After |
|---|---|
| 4 face-related endpoints | 1 endpoint (`/api/face/session`) |
| Client orchestrates identify → register → greeting | Server handles all steps internally |
| Name detection as a separate HTTP endpoint | NameAgent runs inline in the chat stream handler |
| Logic spread across client and multiple route files | Logic centralized in `src/agents/` and `src/lib/faceDb.ts` |
| Hard to debug which step failed | Each agent is an isolated async function; test independently |

The client is dumb — it sends a frame, receives everything it needs, and uses it. The server is smart — it runs the full agent chain internally. Two endpoints, clear separation, no overengineering.