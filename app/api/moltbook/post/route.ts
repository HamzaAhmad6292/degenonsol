import { NextRequest } from "next/server"
import { getMoltbookConfig, createPost } from "@/lib/moltbook"

/**
 * POST /api/moltbook/post
 * Body: { title: string, content?: string, url?: string, submolt?: string }
 * Creates a post on Moltbook as DegenAI. Rate: 1 post per 30 min.
 */
export async function POST(request: NextRequest) {
  const config = getMoltbookConfig()
  if (!config) {
    return Response.json(
      { error: "MOLTBOOK_API_KEY not set. Run scripts/register-moltbook.ts and add the key to .env" },
      { status: 500 }
    )
  }
  try {
    const body = await request.json()
    const { title, content, url, submolt } = body
    if (!title || (typeof title !== "string")) {
      return Response.json({ error: "title is required" }, { status: 400 })
    }
    const result = await createPost(config, {
      submolt: submolt ?? "general",
      title,
      ...(content != null && { content: String(content) }),
      ...(url != null && { url: String(url) }),
    })
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Moltbook post failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
