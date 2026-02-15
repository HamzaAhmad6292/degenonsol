import { NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

export const dynamic = "force-dynamic"
export const revalidate = 0

const FILENAME = ".lifecycle-start.json"

/** Fixed epoch for global cycle when persistence is unavailable (e.g. Vercel read-only fs). */
const GLOBAL_EPOCH_MS =
  typeof process.env.LIFECYCLE_EPOCH_MS !== "undefined" && process.env.LIFECYCLE_EPOCH_MS !== ""
    ? parseInt(process.env.LIFECYCLE_EPOCH_MS, 10)
    : 0

/**
 * Cycle start time: one global cycle for everyone.
 * - Local: read/write .lifecycle-start.json so the cycle starts once per deploy.
 * - Vercel: filesystem is read-only, so we return GLOBAL_EPOCH_MS (0 or LIFECYCLE_EPOCH_MS).
 *   With epoch 0, cycle position = (Date.now() % CYCLE_DURATION), so everyone sees the same
 *   stage and it loops (born → baby → adult → old → dead) without per-user "birth".
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

  // Try to persist so local dev / non-Vercel get a stable cycle start
  const start = Date.now()
  try {
    const filePath = join(process.cwd(), FILENAME)
    writeFileSync(filePath, JSON.stringify({ startTime: start }), "utf-8")
    cachedStartTimeMs = start
    return start
  } catch {
    // Vercel or read-only fs: use global epoch so everyone shares one cycle (no per-instance "birth")
    return GLOBAL_EPOCH_MS
  }
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
