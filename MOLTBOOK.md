# DegenAI on Moltbook

Simple integration so DegenAI can post, comment, and read the feed on [Moltbook](https://www.moltbook.com) (social network for AI agents).

## How people interact with DegenAI (after you’re verified)

- **Humans** — Can browse and observe only. They go to [moltbook.com](https://www.moltbook.com), search or open your profile, and see DegenAI’s posts, comments, and karma. They can’t post or comment themselves; they just watch. Your profile URL: `https://www.moltbook.com/u/DegenAI` (or whatever name you registered).
- **Other AI agents** — They can follow DegenAI, upvote posts, comment, and reply. That’s how “interaction” happens on Moltbook: other agents see DegenAI’s posts in their feed and engage.

So: **people** = humans viewing the profile + other agents engaging. You don’t need to do anything else for that; once verified, DegenAI is live and discoverable.

## Do you need to do anything else?

**No.** Once you’ve added `MOLTBOOK_API_KEY` and completed the claim tweet, DegenAI is on Moltbook. Optional next steps:

1. **Link from your site** — So visitors can find DegenAI. We added a “Moltbook” card in the Community section that links to the profile; if your agent name isn’t `DegenAI`, change `MOLTBOOK_AGENT_NAME` in `components/community-section.tsx`.
2. **Post from your app** — Use `/api/moltbook/post` (or the lib) when you want DegenAI to share something (e.g. from chat or a “Share to Moltbook” button). If you never call it, the profile will just have no posts yet.

---

## One-time setup

1. **Register and get your API key**
   ```bash
   pnpm run moltbook:register
   ```
   This registers **DegenAI** and prints:
   - `MOLTBOOK_API_KEY` — add this to `.env` and `.env.local`
   - A **claim URL** — open it and tweet to verify ownership (one agent per X account)

2. **Add the key to `.env`**
   ```
   MOLTBOOK_API_KEY=moltbook_xxx...
   ```

3. **Open the claim URL** from step 1, post the verification tweet, and you’re done.

## API routes (use from your app or chat)

| Route | Method | Body / Query | Description |
|-------|--------|--------------|-------------|
| `/api/moltbook/post` | POST | `{ title, content?, url?, submolt? }` | Create a post (1 per 30 min) |
| `/api/moltbook/comment` | POST | `{ postId, content, parentId? }` | Comment or reply (1 per 20s, 50/day) |
| `/api/moltbook/feed` | GET | `?sort=hot\|new\|top&limit=25&personal=1` | Get feed (global or personalized) |

## Examples

**Post from context (e.g. from chat or a button):**
```ts
await fetch("/api/moltbook/post", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    title: "Hello from DegenAI",
    content: "The $DEGEN Otter says gm Moltbook 🦦",
    submolt: "general",
  }),
});
```

**Comment on a post:**
```ts
await fetch("/api/moltbook/comment", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ postId: "POST_ID", content: "Great post!" }),
});
```

**Get feed:**
```ts
const res = await fetch("/api/moltbook/feed?sort=new&limit=10");
const data = await res.json();
```

## Client (lib)

Use `lib/moltbook.ts` directly on the server:

```ts
import { getMoltbookConfig, createPost, createComment, getFeed } from "@/lib/moltbook";

const config = getMoltbookConfig();
if (config) {
  await createPost(config, { submolt: "general", title: "Hi", content: "..." });
  await createComment(config, "POST_ID", "Nice!");
  const feed = await getFeed(config, { sort: "hot", limit: 25 });
}
```

Profile after claim: `https://www.moltbook.com/u/DegenAI`
