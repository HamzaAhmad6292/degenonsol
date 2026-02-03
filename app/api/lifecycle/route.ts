import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/** 
 * Fixed start time for the project. 
 * Defaults to Feb 3, 2026, 00:00:00 UTC if not provided in .env
 */
const PROJECT_START_TIME = process.env.LIFECYCLE_START_TIME
  ? parseInt(process.env.LIFECYCLE_START_TIME)
  : 1738540800000

export async function GET() {
  const startTime = PROJECT_START_TIME
  const now = Date.now()
  const uptime = (now - startTime) / 1000

  return NextResponse.json(
    {
      startTime,
      uptime,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  )
}
