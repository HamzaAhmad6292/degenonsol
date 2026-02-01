/**
 * Simple Moltbook API client for DegenAI.
 * Base: https://www.moltbook.com/api/v1
 * Docs: https://moltbook.com/skill.md
 */

const BASE = "https://www.moltbook.com/api/v1";

function getHeaders(apiKey: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

export type MoltbookConfig = {
  apiKey: string;
};

/** One-time registration. Returns api_key and claim_url for your human to tweet. */
export async function register(name: string, description: string) {
  const res = await fetch(`${BASE}/agents/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = [data.error, data.hint, data.message].filter(Boolean).join(" — ") || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  // API can return { agent } or { data: { agent } } etc.
  const agent = data.agent ?? data.data?.agent;
  if (!agent?.api_key || !agent?.claim_url) {
    throw new Error("Unexpected Moltbook response: missing api_key or claim_url");
  }
  return { agent, important: data.important ?? "⚠️ SAVE YOUR API KEY!" };
}

/** Create a post (text or link). Submolt default: general. Rate: 1 post per 30 min. */
export async function createPost(
  config: MoltbookConfig,
  opts: {
    submolt?: string;
    title: string;
    content?: string;
    url?: string;
  }
) {
  const { submolt = "general", title, content, url } = opts;
  const body = url
    ? { submolt, title, url }
    : { submolt, title, ...(content ? { content } : { content: "" }) };
  const res = await fetch(`${BASE}/posts`, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook post failed");
  return data;
}

/** Add a comment. Rate: 1 per 20s, 50/day. */
export async function createComment(
  config: MoltbookConfig,
  postId: string,
  content: string,
  parentId?: string
) {
  const body = parentId ? { content, parent_id: parentId } : { content };
  const res = await fetch(`${BASE}/posts/${postId}/comments`, {
    method: "POST",
    headers: getHeaders(config.apiKey),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook comment failed");
  return data;
}

/** Get feed. sort: hot | new | top | rising. */
export async function getFeed(config: MoltbookConfig, opts?: { sort?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (opts?.sort) params.set("sort", opts.sort);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const q = params.toString() ? `?${params}` : "";
  const res = await fetch(`${BASE}/posts${q}`, {
    headers: getHeaders(config.apiKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook feed failed");
  return data;
}

/** Get personalized feed (submolts + followed agents). */
export async function getPersonalFeed(
  config: MoltbookConfig,
  opts?: { sort?: string; limit?: number }
) {
  const params = new URLSearchParams();
  if (opts?.sort) params.set("sort", opts.sort ?? "hot");
  if (opts?.limit) params.set("limit", String(opts.limit ?? 25));
  const q = params.toString() ? `?${params}` : "?sort=hot&limit=25";
  const res = await fetch(`${BASE}/feed${q}`, {
    headers: getHeaders(config.apiKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook feed failed");
  return data;
}

/** Upvote a post. */
export async function upvotePost(config: MoltbookConfig, postId: string) {
  const res = await fetch(`${BASE}/posts/${postId}/upvote`, {
    method: "POST",
    headers: getHeaders(config.apiKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook upvote failed");
  return data;
}

/** Downvote a post. */
export async function downvotePost(config: MoltbookConfig, postId: string) {
  const res = await fetch(`${BASE}/posts/${postId}/downvote`, {
    method: "POST",
    headers: getHeaders(config.apiKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook downvote failed");
  return data;
}

/** Upvote a comment. */
export async function upvoteComment(config: MoltbookConfig, commentId: string) {
  const res = await fetch(`${BASE}/comments/${commentId}/upvote`, {
    method: "POST",
    headers: getHeaders(config.apiKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook upvote failed");
  return data;
}

/** Get agent status (pending_claim | claimed). */
export async function getStatus(config: MoltbookConfig) {
  const res = await fetch(`${BASE}/agents/status`, {
    headers: getHeaders(config.apiKey),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? data.hint ?? "Moltbook status failed");
  return data as { status: "pending_claim" | "claimed" };
}

/** Get config from env. Use after setting MOLTBOOK_API_KEY. */
export function getMoltbookConfig(): MoltbookConfig | null {
  const apiKey = process.env.MOLTBOOK_API_KEY?.trim();
  return apiKey ? { apiKey } : null;
}
