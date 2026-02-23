# Visual Memory & Face-Based Identity — Requirements

## 1. Purpose

This document defines the **requirements** for the otter’s visual memory: identifying users by face (no login), remembering them and their conversation, and handling names through an agent—not rule-based logic. Implementation will be done in a separate document/phase.

---

## 2. Goals

- **Identity by face only**: No sign-up or login. The otter recognizes people by their face.
- **Persistent memory**: When the same person returns, the otter recalls prior conversations and can continue naturally.
- **Natural name handling**: The otter learns the user’s name only when the user naturally reveals it in conversation; detection of “user said their name” is done by an **agent/tool**, not by fixed rules or regex. After seeing the users face , the otter will ask for the name.
- **Otter initiates after face**: As soon as a face is seen (new or returning), the otter **always** starts the conversation (speaks first). If no face is seen, no special greeting or registration.

---

## 3. Triggers and Flows

### 3.1 When Nothing Special Happens

- **No face visible**: Do not attempt to identify, register, or greet by identity. The experience is the same as today (anonymous chat). No proactive “What’s your name?” unless it comes from normal conversation.

### 3.2 When a Face Is Seen

The moment the system **detects a face** in the camera feed (one or more faces; see Section 5 for multi-face behavior):

1. **Attempt to identify** the face (e.g. match against stored face embeddings).
2. **Branch**:
   - **Recognized (returning user)** → Retrieve identity and conversation history; then **otter initiates** the chat (e.g. greeting using name and context).
   - **Not recognized (new user)** → **Register** the face as a new identity; then **otter initiates** the chat and, in the course of that conversation, **asks for the user’s name** in a natural way (not a mandatory form). When the user reveals their name in free text, an **agent/tool** detects it and the system stores the name for that identity.
3. In both branches, **the otter must speak first** after the face is seen. The user may speak or type afterward; the chat then continues as normal.

So: **Face seen → identify or register → otter always initiates; name is learned only when the agent detects it in conversation**

---

## 4. Name Handling (Agent-Based, Not Rule-Based)

### 4.1 Requirement: No Rule-Based Name Detection

- The system **must not** rely on:
  - Regex or keyword rules (e.g. “my name is X”, “call me Y”, “I’m Z”).
  - Fixed templates or pattern matching on the user’s message alone.
- Name capture **must** be driven by an **agent (or agent-like component)** that:
  - Interprets the user’s message in context (e.g. that the otter asked for a name, or that the user volunteered it).
  - Decides whether the user **has provided a name** (or a nickname/preference).
  - Outputs a structured result (e.g. “name provided: yes/no” and, if yes, the name to store).

### 4.2 Agent / Tool Role

- There must be a **tool or agent** whose responsibility is: **“Did the user just say their name (or a name they want to be called)?”**
- Inputs to this agent/tool should include (as appropriate):
  - The current user message.
  - Recent conversation context (e.g. last few turns), so the agent can use the fact that the otter asked “What should I call you?” or similar.
- Outputs must be something like:
  - Whether a name was expressed (boolean or enum).
  - The name string to store (if any), possibly normalized (e.g. trim, single form).
- The rest of the system (e.g. persistence, face identity) **consumes** this result to store the name against the correct face identity. How that storage is implemented is out of scope for this requirements doc.

### 4.3 When to Invoke the Name Agent/Tool

- The agent/tool should be invoked when it’s **relevant** to the conversation (e.g. for messages in a session where the otter has asked for a name, or for any message when the identity is new and name is not yet set). Exact invocation policy (every message vs. only when “asking for name” is in context) can be an implementation choice, but the **requirement** is that name detection is always agent-driven, not rule-based.

### 4.4 Single Source of Truth

- For a given face identity, there is **one** stored name (or “no name yet”). If the user later says “Actually call me X” or “I prefer Y”, the agent can detect that and the system may update the stored name; the requirements only insist that any such update is also driven by the agent/tool, not by rules.

---

## 5. Face Visibility and Identity

### 5.1 “Face Is Seen”

- “Face is seen” means the system has determined that at least one face is present in the current (or a chosen) frame from the camera.
- Requirements do not mandate how (e.g. confidence threshold, which model); they only require that the rest of the behavior is **gated** on this condition.

### 5.2 New vs Returning

- **New**: No matching stored identity for the detected face (above the chosen similarity threshold). Action: register new identity, then otter initiates and naturally asks for name; name is stored only when the agent/tool says “user provided name: X”.
- **Returning**: A match is found. Action: load identity and conversation history; otter initiates (e.g. “Hey [Name], …” or a contextual opener). Chat continues; no need to ask for name again unless the product explicitly allows “change my name”.

### 5.3 Multiple Faces

- Requirements should define behavior when **multiple faces** are visible (e.g. two people in frame). Options to decide in implementation:
  - Treat as “one user” (e.g. largest face, or first detected) and attach conversation to that identity.
  - Or treat as ambiguous and do not assign identity / do not initiate by identity until the scenario is clearer (e.g. single face).
- The requirements doc should state: **the product must define a clear policy for “multiple faces”** (e.g. primary face only, or no identity until single face). Implementation will follow that policy.

---

## 6. Otter-Initiated Chat (After Face Is Seen)

### 6.1 Mandate

- **After** a face is seen and either (a) the face is recognized, or (b) the face is registered as new:
  - The **otter must initiate** the conversation (send the first message in that “session” or context).
- The content of that first message can be:
  - **Returning user**: Greeting + optional reference to past context (e.g. last topic, or “good to see you again”).
  - **New user**: Greeting + natural prompt to learn name (e.g. “What should I call you?”) within the flow of conversation, not as a mandatory field.

### 6.2 No Face → No Identity-Based Initiation

- If no face is ever seen in the session, the otter does **not** need to send a special “identity” greeting. Normal anonymous chat behavior is fine.

---

## 7. Conversation Continuity

### 7.1 Returning User

- When the face is recognized, the system must **retrieve** that user’s conversation history (or a summary/recent slice) so that:
  - The otter’s first message can be contextual (“Last time we talked about …” or “Good to see you again, [Name]”).
  - Subsequent turns can use the same history so the conversation feels continuous.

### 7.2 New User

- After registration, the conversation from that point on is **associated** with the new identity. Once the agent/tool detects a name, it is stored with that identity. Future visits (same face) will then be “returning user” with that name and history.

---

## 8. Data and Concepts (What, Not How)

- **Face identity**: Some representation that allows “same person” to be recognized across visits (e.g. face embedding or stable ID derived from it). One identity can have:
  - One or more stored face embeddings (to improve matching).
  - At most one **display name** (the name the otter uses), set only when the agent/tool reports that the user provided a name.
- **Conversation history**: Messages (and optionally metadata) tied to a face identity, so that returning users get continuity and the otter can initiate with context.
- **Name**: A string stored per identity; source is **only** the agent/tool output, never rule-based parsing.

---

## 9. Edge Cases and Assumptions

- **No name yet**: If the user is new and never says a name (or the agent never detects one), the identity still exists; the otter can keep talking without using a name, and may ask again naturally later.
- **Recognition errors**: False positives (wrong person) and false negatives (same person not recognized) are possible; implementation will need thresholds and possibly “update embedding” or “merge identity” policies. This doc only requires that the **behavior** (initiate, ask for name when new, use name when known) is as above; tuning of accuracy is implementation.
- **Privacy / consent**: Requirements assume the product has or will define how consent and data retention are handled (e.g. user is aware of camera and face storage). No specific consent flows are mandated here.
- **Single device / single browser**: Whether identity is scoped per device, per browser, or globally is an implementation choice; the requirements only assume that “same face” can be associated with one identity and one history for the purpose of the described flows.

---

## 10. Summary Checklist

- [ ] No face → no identity flow; no mandatory otter initiation by identity.
- [ ] Face seen → identify or register; then **otter always initiates** (speaks first).
- [ ] New face → register → otter initiates and asks for name in natural conversation.
- [ ] Name is **only** stored when an **agent/tool** determines “user provided name”; **no rule-based** (regex/template) name extraction.
- [ ] Returning face → load identity + history; otter initiates with contextual greeting (e.g. using name and past context).
- [ ] Clear product policy for **multiple faces** in frame (to be implemented).
- [ ] One stored name per identity; updates only via agent/tool.

This document is **requirements-only**. Implementation (APIs, DB schema, agent/tool design, face pipeline, prompts) will be described in a separate document.
