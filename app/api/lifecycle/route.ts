import { NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

export const dynamic = "force-dynamic"
export const revalidate = 0

const FILENAME = ".lifecycle-start.json"

/**
 * Cycle start time: persisted so it survives page refresh and server restarts.
 * - Reads from file first; if missing or invalid, sets start = now and writes file.
 * - In-memory cache avoids repeated file reads in the same process.
 * - On Vercel (read-only fs), file write fails and we fall back to in-memory per instance;
 *   add Vercel KV and use it in this route if you need persistence across refreshes there.
 */
let cachedStartTimeMs: number | null = null

function getCycleStartTime(): number {
  if (cachedStartTimeMs != null) return cachedStartTimeMs

  try {
    const filePath = join(process.cwd(), FILENAME)
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, "utf-8")
      const data = JSON.parse(raw) as { startTime?: number }
      if (typeof data.startTime === "number" && data.startTime > 0) {
        cachedStartTimeMs = data.startTime
        return cachedStartTimeMs
      }
    }
  } catch {
    // ignore (e.g. read-only fs on Vercel)
  }

  const start = Date.now()
  cachedStartTimeMs = start

  try {
    const filePath = join(process.cwd(), FILENAME)
    writeFileSync(filePath, JSON.stringify({ startTime: start }), "utf-8")
  } catch {
    // e.g. read-only filesystem; in-memory cache still used for this process
  }

  return start
}

export async function GET() {
  const startTime = getCycleStartTime()
  const uptime = (Date.now() - startTime) / 1000

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
