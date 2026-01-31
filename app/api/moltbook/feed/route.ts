import { NextRequest } from "next/server"
import { getMoltbookConfig, getFeed, getPersonalFeed } from "@/lib/moltbook"

/**
 * GET /api/moltbook/feed
 * Query: ?sort=hot|new|top|rising&limit=25&personal=1
 * Returns Moltbook feed (global or personalized).
 */
export async function GET(request: NextRequest) {
  const config = getMoltbookConfig()
  if (!config) {
    return Response.json(
      { error: "MOLTBOOK_API_KEY not set. Run scripts/register-moltbook.ts and add the key to .env" },
      { status: 500 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const sort = searchParams.get("sort") ?? "hot"
    const limit = Math.min(Number(searchParams.get("limit")) || 25, 50)
    const personal = searchParams.get("personal") === "1"

    const result = personal
      ? await getPersonalFeed(config, { sort, limit })
      : await getFeed(config, { sort, limit })
    return Response.json(result)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Moltbook feed failed"
    return Response.json({ error: message }, { status: 500 })
  }
}
