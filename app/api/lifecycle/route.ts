import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/** Start time = when this server process started. Cycle restarts on every server restart. */
function getServerStartTime(): number {
  return Date.now() - process.uptime() * 1000
}

export async function GET() {
  const startTime = getServerStartTime()
  return NextResponse.json(
    {
      startTime,
      uptime: process.uptime(),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    }
  )
}
