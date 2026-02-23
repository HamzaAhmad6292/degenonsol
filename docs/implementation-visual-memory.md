# Visual Memory & Face-Based Identity — Technical Implementation

This document describes the **complete technical implementation** for the otter’s visual memory feature, as specified in [requirements-visual-memory.md](./requirements-visual-memory.md). It covers architecture, data model, APIs, face pipeline, name agent, client flow, and integration with the existing chat stack.

---

## 1. Overview

### 1.1 Goals (from requirements)

- Identify users by **face only** (no login).
- **Persist** conversation history per face identity.
- Learn **name** only when an **agent** detects it in conversation (no rule-based extraction).
- **Otter initiates** the conversation as soon as a face is seen (new or returning).

### 1.2 Architecture (no separate backend)

All logic runs in the **existing Next.js app** plus a **single database** (Supabase: Postgres + pgvector). No new long-running backend service.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Client (React)                                                             │
│  - Camera → frame capture (existing: DraggableCamera, captureCurrentCameraFrame) │
│  - Face detection (new: in-browser or send frame to API)                   │
│  - Call /api/face/identify when face visible → get identity or register     │
│  - Otter-initiated first message (TTS) when identity is set                 │
│  - Chat UI sends userId + conversationId; after assistant reply, call     │
│    name-detection when relevant                                             │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Next.js API Routes                                                         │
│  - POST /api/face/identify     (frame or embedding → match or register)     │
│  - POST /api/face/register     (frame + optional name → new identity)       │
│  - POST /api/face/name-detect  (user message + context → name extracted?)   │
│  - POST /api/face/greeting     (userId, isNew → otter first message)        │
│  - POST /api/chat/stream      (extended: userId, persist to DB, name hook)  │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Supabase (Postgres + pgvector)                                             │
│  - face_users           (id, display_name, created_at, updated_at)          │
│  - face_embeddings      (user_id, embedding vector, created_at)              │
│  - conversations       (id, user_id, created_at)                           │
│  - messages            (conversation_id, role, content, created_at)          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Tech stack (additions)

| Layer | Choice | Notes |
|-------|--------|------|
| DB + vectors | **Supabase** (Postgres + pgvector) | One place for identities, embeddings, conversations |
| Face detection | **Server-side** (recommended) or client (face-api.js / MediaPipe) | See Section 4 |
| Face embedding | Same as detection provider (e.g. OpenAI embeddings for face crop, or dedicated face API) | Must be consistent for similarity search |
| Name detection | **OpenAI** (or same LLM as chat) with **structured output** or **tool use** | Agent decides “name provided: yes/no” and value |

Existing stack (unchanged): Next.js 16, React 19, `/api/chat/stream`, `useStreamingChat`, `captureCurrentCameraFrame`, TTS pipeline, `otterSoulConfig`.

---

## 2. Data Model (Supabase)

### 2.1 Enable pgvector

In Supabase SQL editor:

```sql
create extension if not exists vector;
```

### 2.2 Tables

**face_users**

Stores one row per recognized “face identity” (display name optional until agent sets it).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK, default `gen_random_uuid()` |
| display_name | text | Nullable; set only when name-detection agent returns a name |
| created_at | timestamptz | First time this face was registered |
| updated_at | timestamptz | Last update (e.g. name set/updated) |

**face_embeddings**

One or more embeddings per user (improves matching over time; optional “update embedding” on login).

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → face_users.id |
| embedding | vector(512) | Or 128/256 depending on face model; see Section 4 |
| created_at | timestamptz | When this embedding was added |

Index for similarity search (adjust dimension to match your embedding size):

```sql
create index on face_embeddings
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
```

**conversations**

One conversation per “session” or per user; can be 1:1 with user or one active conversation per user.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | FK → face_users.id (nullable for anonymous; required when face is known) |
| created_at | timestamptz | |

**messages**

Chat messages for continuity and for loading “last N” for returning users.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations.id |
| role | text | 'user' | 'assistant' | 'system' |
| content | text | Message body |
| created_at | timestamptz | |

Indexes: `conversation_id`, `(conversation_id, created_at)` for recent messages.

### 2.3 Identity and conversation linkage

- **Anonymous (no face)**: No `face_users` row; `conversation_id` can be ephemeral (current in-memory behavior or a DB row with `user_id = null` if you want to persist anonymous chats).
- **Face seen**: Either **identify** (existing `user_id`) or **register** (new `face_users` row + first `face_embeddings` row). Then:
  - Create or reuse a **conversation** for that `user_id`.
  - All subsequent messages in that session are stored under that `conversation_id` and `user_id`.

---

## 3. API Design

### 3.1 POST /api/face/identify

**Purpose:** Given a camera frame (or a precomputed face embedding), determine if this face is known or new; if new, optionally register and return the new identity.

**Request body:**

```ts
{
  frameData: string | null;   // data URL (e.g. "data:image/jpeg;base64,...") from captureCurrentCameraFrame()
  embedding?: number[];      // optional: if client computes embedding, send this instead of frameData
  registerIfUnknown?: boolean; // default true: create new identity when no match
}
```

**Response (200):**

```ts
{
  status: "identified" | "registered" | "no_face";
  userId: string | null;      // uuid of face_users.id
  displayName: string | null;
  isNewUser: boolean;         // true if just registered
  greeting?: string;          // suggested first message for otter to speak (see Section 7)
}
```

**Server flow:**

1. If `frameData`: run **face detection** on image; if no face → return `status: "no_face"`, `userId: null`. If multiple faces, apply **multiple-faces policy** (e.g. use largest face or return “no_face”; see Section 8).
2. If face(s) found: crop/main face → compute **face embedding** (same model as stored).
3. If `embedding` provided and no `frameData`: skip detection and step 2; use provided embedding.
4. **Vector search**: query `face_embeddings` for nearest neighbor (cosine similarity). If best distance &lt; threshold (e.g. 0.2–0.3 for cosine) → **identified**; load `face_users` row, set `userId`, `displayName`, `isNewUser: false`.
5. If no match and `registerIfUnknown`:
   - Insert `face_users` (no `display_name`).
   - Insert `face_embeddings` (user_id, embedding).
   - Return `status: "registered"`, new `userId`, `displayName: null`, `isNewUser: true`.
6. If no match and not register: return `status: "no_face"` (or a dedicated “unknown” status) and `userId: null`.
7. If identified or registered: compute **greeting** (Section 7) and include in response so client can speak it immediately.

### 3.2 POST /api/face/register

**Purpose:** Explicitly register a new face (e.g. if client previously got “no_face” and later gets a clear frame). Can be merged with identify (identify + register-if-unknown) as above; this endpoint is optional for “register only” flows.

**Request:** Same as identify (frame or embedding).  
**Response:** Same shape: `userId`, `displayName: null`, `isNewUser: true`, optional `greeting`.

### 3.3 POST /api/face/name-detect (Name Agent)

**Purpose:** Agent-only name detection. Input: last user message + recent conversation context. Output: whether the user provided a name and the string to store. **No regex or rule-based logic.**

**Request body:**

```ts
{
  userId: string;            // so we can update face_users.display_name
  userMessage: string;       // current/last user message
  recentTurns: { role: "user" | "assistant"; content: string }[];  // last 4–6 turns for context
}
```

**Response (200):**

```ts
{
  nameProvided: boolean;
  name: string | null;       // normalized display name to store (trim, single form)
}
```

**Server flow:**

1. Call OpenAI (or same LLM) with a **system prompt** that:
   - States the task: “Determine if the user has just provided the name they want to be called (e.g. in response to ‘What should I call you?’ or volunteered).”
   - Instructs: output only a structured answer (name provided yes/no, and the name string if yes). No rule-based parsing in code.
2. Use **structured output** (e.g. JSON schema / response_format) or a **tool** that returns `{ nameProvided: boolean, name: string | null }`.
3. If `nameProvided && name`:
   - Update `face_users set display_name = name, updated_at = now() where id = userId`.
4. Return the same object to the client (client can show “Got it, I’ll call you X” or rely on next turn).

**When to call:** After each assistant reply when **userId** is set and **display_name** is null (or when you want to allow “change my name” and call it for every message). Optionally limit to “only when last assistant message was asking for name” to reduce cost; requirement is “agent-driven,” not “every message” vs “only when asked.”

### 3.4 POST /api/face/greeting

**Purpose:** Generate the otter’s first message after a face is seen (new or returning). Can be inlined in `/api/face/identify` response; if separate, use this when client already has `userId` and only needs the greeting text.

**Request body:**

```ts
{
  userId: string;
  isNewUser: boolean;
  displayName: string | null;
  lastMessages?: { role: string; content: string }[];  // recent history for returning users
}
```

**Response (200):** `{ greeting: string }` — one or two sentences for TTS.

**Server flow:** Call LLM with short prompt: “You are the $DEGEN Otter. Generate a single short greeting (1–2 sentences). If returning user with name: greet by name and optionally reference last topic. If new user: greet and naturally ask what to call them. No emojis in this greeting.” Return the string.

### 3.5 Changes to POST /api/chat/stream

**Current behavior:** Accepts `message`, `conversationId`, `mood`, `trend`, `lifecycleStage`, `frameData`; uses in-memory `conversations` Map; returns streamed assistant reply.

**New behavior (additive):**

1. **Accept optional `userId`** (uuid). If present, conversation is tied to that face identity.
2. **Resolve conversation:**
   - If `userId` present: get or create a **conversation** row for this user (e.g. “current” conversation per user or create one per session). Use that `conversation_id` for persistence. If you keep an in-memory cache for low latency, seed it from DB when `userId` is provided and conversation exists.
   - If `userId` absent: keep current behavior (ephemeral `conversationId` and in-memory only, or persist with `user_id = null` if desired).
3. **Persist messages:** After each user and assistant turn, upsert into `messages` for the resolved `conversation_id`.
4. **Name detection hook:** After the assistant message is fully generated and stored:
   - If `userId` is set and the identity has no `display_name` yet (or you support “change name”): call the **name-detect** logic (inline or internal call to same logic as `/api/face/name-detect`) with the last user message and recent turns. If result is `nameProvided: true`, update `face_users.display_name` and optionally include a hint in the stream (e.g. `{ type: "name_stored", name }`) so the client can show a toast or next turn can use the name.
5. **System prompt:** When `userId` and `displayName` are known, inject into system prompt: “The user’s name is [displayName]. Use it when appropriate.” When `userId` is set but `displayName` is null: “You have not learned the user’s name yet; naturally ask once in a friendly way.”

No breaking change: if `userId` is not sent, behavior stays as today (anonymous, in-memory).

---

## 4. Face Pipeline (Detection + Embedding)

### 4.1 Options

| Approach | Pros | Cons |
|---------|------|------|
| **Server-side (frame in, embedding out)** | Single source of truth, no client bundle for face model | Must send frame to API; need a face model or external API on server |
| **Client-side (e.g. face-api.js, MediaPipe)** | No frame sent (privacy), offload compute to client | Larger bundle; embedding format must match DB |

**Recommendation:** **Server-side** for consistency and simpler client. Send one frame (data URL) from `captureCurrentCameraFrame()` to `/api/face/identify`; server runs detection + embedding and vector search.

### 4.2 Server-side implementation options

1. **External face API:** Call a service that accepts image URL or base64 and returns a face embedding vector (e.g. CompreFace, FaceIO, or cloud face recognition APIs). Use the returned vector for pgvector search. Dimension must match your `face_embeddings.embedding` (e.g. 512).
2. **OpenAI Vision + embedding:** Crop face (e.g. with a simple detector or bounding box from another tool), then use OpenAI embedding model. Less ideal for “face identity” (embeddings are semantic, not face-specific); use only if you have no face-specific API.
3. **Dedicated face model on server:** Run a small model (e.g. InsightFace, or a Hugging Face face recognition model) inside the API route or a serverless function. Output dimension must match `vector(n)` in DB.

Choose one; keep **embedding dimension and model fixed** so all stored vectors are comparable.

### 4.3 Multiple faces policy (implementation)

- **Primary-face policy:** Detect all faces; pick one (e.g. largest by bbox area, or center-most). Use only that face for embedding and identify/register. Conversation is tied to that one identity.
- **Single-face policy:** If more than one face in frame, return `no_face` and do not identify/register until exactly one face is present.

Document the chosen policy in code and in the requirements “multiple faces” section.

### 4.4 Thresholds

- **Similarity threshold:** For cosine similarity, a typical range is 0.2–0.4 (depending on model). Above threshold → same identity; below → unknown. Tune to balance false positives (wrong person) and false negatives (same person not recognized).
- **Confidence for “face present”:** Only run embedding and lookup when detection confidence &gt; a set minimum (e.g. 0.8) so random noise does not create identities.

---

## 5. Name Detection Agent (Detailed)

### 5.1 No rule-based logic

The code must **not** infer a name by:
- Regex on `userMessage` (e.g. “my name is X”, “call me Y”).
- Keyword or template matching.

Only the **LLM (agent)** decides, given:
- The current user message.
- Recent conversation turns (so it knows if the otter asked “What should I call you?”).

### 5.2 Implementation

- **Endpoint:** `POST /api/face/name-detect` (or an internal function called from the chat stream handler).
- **Input:** `userId`, `userMessage`, `recentTurns` (e.g. last 4–6 messages).
- **Model:** Same as chat (e.g. `gpt-4o-mini`) or a small dedicated call.
- **Prompt (conceptual):**
  - System: “You are a classifier. Given the user’s latest message and the recent conversation, determine ONLY whether the user has provided the name they want to be called (e.g. in direct answer to ‘What should I call you?’ or ‘What’s your name?’, or volunteered). If yes, output that name only (one string, no nicknames unless they said it). If no or ambiguous, output that no name was provided. Do not use rules; use understanding of context and intent.”
  - User: “Recent conversation: [recentTurns]. User’s latest message: [userMessage]. Did the user provide a name? If yes, what is the exact name string to store?”
- **Output:** Use **structured output** (e.g. `response_format: { type: "json_schema", schema: { nameProvided: boolean, name: string | null } }`) or a **tool** that the model calls with the same shape. Parse once; if `nameProvided && name`, update `face_users.display_name` for `userId` and return.

### 5.3 Invocation policy

- **Minimum:** For every new-identity session where `display_name` is null, call name-detect **after each assistant reply** (with the last user message and recent turns). When `display_name` is set, stop calling for that user unless you add “change my name” later.
- **Alternative:** Call only when the last assistant message contains a name-asking intent (e.g. another small LLM call or a keyword like “call you” / “your name”) to reduce cost. Requirement is still “agent decides,” not “regex.”

---

## 6. Client Implementation

### 6.1 State and identity lifecycle

- **Camera off / no face:** Do not call `/api/face/identify`. Use anonymous chat (current behavior): `conversationId` ephemeral, no `userId`, no otter-initiated greeting.
- **Camera on:** When the camera is available and the user has granted access:
  - Periodically (e.g. every 2–3 seconds) or on “user visible” event: capture one frame via `captureCurrentCameraFrame()`.
  - Call `POST /api/face/identify` with `frameData` and `registerIfUnknown: true`.
  - If response is `no_face`: do nothing; optionally retry later.
  - If response is `identified` or `registered`:
    - Store `userId`, `displayName`, `isNewUser` in state (e.g. React state or context).
    - **Create or resolve conversation:** Call an endpoint that returns or creates a `conversation_id` for this `userId` (or derive from `userId` + “current” session). Set that as the **conversationId** for the rest of the session.
    - **Otter initiates:** Use `greeting` from the response (or call `/api/face/greeting` with `userId`, `isNewUser`, `displayName`, optional last messages). Play the greeting with the **existing TTS pipeline** (same as chat) and add it as the first assistant message in the UI. No user message before this.
  - Only run this “identify once per session” or “identify when face first appears” so you don’t re-register on every tick; e.g. once you get `identified` or `registered`, stop calling identify until the next page load or explicit “new session.”

### 6.2 Conversation and chat

- **useStreamingChat (or equivalent):**
  - Accept an optional `userId` and optional `conversationId` (from server when face is known). If `userId` is set, pass it to every `POST /api/chat/stream` request so the server can persist to DB and run name detection.
  - When identity is established from face, **replace or seed** the initial message list: if returning user, optionally load last N messages from API and set them as initial state; then append the **greeting** as the first new assistant message and play it via TTS.
- **Sending a message:** Include `userId` (if set) and `conversationId` in the body of `/api/chat/stream`. Server persists and runs name-detect when relevant.
- **After stream done:** If you want to show “I’ll call you X” in the UI when name is stored, the server can send a final SSE event `{ type: "name_stored", name }` and the client can show a toast or inject a short assistant line.

### 6.3 ConversationId vs userId

- **Anonymous:** `conversationId` = ephemeral (e.g. `conv-${Date.now()}`); no `userId`. Current behavior.
- **Face known:** `userId` = from `/api/face/identify`. `conversationId` = server-provided or client-generated UUID that is **bound to this userId** and stored in `conversations` so all messages for this session are under one `conversation_id` and `user_id`.

---

## 7. Proactive Greeting (Otter Initiates)

- When the client receives `identified` or `registered` with a `greeting` string:
  1. Append an assistant message with content = `greeting`.
  2. Call the existing **TTS pipeline** to speak `greeting` (same as for streamed chat).
  3. Optionally fetch “last few messages” for returning users and pass them to the greeting API so the LLM can say “Last time we talked about …” or “Good to see you again, [Name].”
- Greeting content:
  - **Returning user with name:** Short “Hey [Name], welcome back!” plus optional reference to last topic.
  - **Returning user without name:** “Good to see you again!” (name was never set).
  - **New user:** “Hey! I’m the $DEGEN Otter. What should I call you?” (or similar; keep it one sentence so TTS is quick).

---

## 8. Multiple Faces Policy (Concrete)

- **Chosen policy:** **Primary face only.** If multiple faces are detected, select one (e.g. largest bounding box or center-most). Use that face for embedding and identify/register. The conversation is tied to that single identity. Document this in code comments and in the requirements doc.
- **Alternative:** If product prefers “no identity when ambiguous,” return `no_face` when count &gt; 1 and do not register until a single face is visible.

---

## 9. Environment Variables and Security

- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or anon key with RLS) for server-side DB access. Use service role only in API routes, never in client.
- **Face pipeline:** If using an external face API, add `FACE_API_KEY` or similar; keep it server-side.
- **OpenAI:** Existing `OPENAI_API_KEY` for chat, greeting, and name-detect.
- **Privacy:** Store only face embeddings and metadata (no raw images in DB). Frames are sent to the server for the duration of the request only; do not log or persist images. Consider consent UI before first face capture (requirements assume this is defined elsewhere).

---

## 10. Implementation Order

Suggested phases:

1. **DB and core face APIs**
   - Create Supabase project; run migrations (tables + pgvector index).
   - Implement face pipeline (detection + embedding) and choose model/API.
   - Implement `POST /api/face/identify` (with register-if-unknown) and optional `POST /api/face/register`.
   - Implement `POST /api/face/greeting` (or inline in identify response).

2. **Conversation persistence**
   - Add `userId` and conversation resolution to `POST /api/chat/stream`; persist messages to `messages` when `userId` is present.
   - Add endpoint or logic to “get or create conversation for user” and return `conversation_id`.

3. **Name agent**
   - Implement `POST /api/face/name-detect` with LLM structured output; update `face_users.display_name`.
   - Integrate name-detect into chat stream (after assistant reply, when user has no name).
   - Optionally stream `name_stored` event to client.

4. **Client**
   - When camera is on, call identify (throttled / once per “face appeared”); on identified or registered, set `userId`, get greeting, resolve `conversationId`.
   - Extend chat hook to pass `userId` and use server `conversationId`; seed initial messages for returning user; play greeting as first message with TTS.
   - Handle “no face” vs “face” so otter initiates only when face was seen.

5. **Tuning and edge cases**
   - Multiple-faces policy in production; similarity and detection thresholds; “update embedding” on re-identify if desired.

This completes the technical implementation description. Implementation can proceed in the order above, with each step testable against the requirements in [requirements-visual-memory.md](./requirements-visual-memory.md).
