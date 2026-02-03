import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * Cycle start time: when this server process (or first request in this instance) started.
 * - Local: process.uptime() is stable, so start is when the Node process started.
 * - Vercel: cold start has uptime 0 (so start = now, we begin at "born"); warm requests
 *   reuse the same start. Cycle advances every 30s per stage (see lib/lifecycle.ts).
 */
let cachedStartTimeMs: number | null = null

function getCycleStartTime(): number {
  if (cachedStartTimeMs != null) return cachedStartTimeMs
  const start = Date.now() - process.uptime() * 1000
  cachedStartTimeMs = start
  return start
}

export async function GET() {
  const startTime = getCycleStartTime()
  const uptime = process.uptime()

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
