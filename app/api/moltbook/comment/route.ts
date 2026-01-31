import { NextRequest } from "next/server"
import { getMoltbookConfig, createComment } from "@/lib/moltbook"

/**
 * POST /api/moltbook/comment
 * Body: { postId: string, content: string, parentId?: string }
 * Adds a comment (or reply) on Moltbook. Rate: 1 per 20s, 50/day.
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
    const { postId, content, parentId } = body
    if (!postId || !content || typeof postId !== "string" || typeof content !== "string") {
      return Response.json({ error: "postId and content are required" }, { status: 400 })
    }
    const result = await createComment(config, postId, content, parentId)
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Moltbook comment failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
