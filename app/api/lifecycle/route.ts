import { NextResponse } from "next/server"
import { readFileSync, writeFileSync, existsSync } from "fs"
import { join } from "path"

const FILENAME = ".lifecycle-start.json"

/** Get a persisted start time so the cycle survives server restarts and module reloads. */
function getPersistedStartTime(): number {
  const HOUR = 60 * 60 * 1000
  const fallbackStart = Date.now() - process.uptime() * 1000

  try {
    const cwd = process.cwd()
    const filePath = join(cwd, FILENAME)
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, "utf-8")
      const data = JSON.parse(raw) as { startTime?: number }
      if (typeof data.startTime === "number" && data.startTime > 0) {
        return data.startTime
      }
    }
  } catch {
    // ignore (e.g. read-only fs in serverless)
  }

  // First run or invalid file: use a start time in the past so we're not stuck in "born"
  // (e.g. 2 hours ago = adult stage; cycle will then progress normally)
  // If process just started (uptime ~0), use 2h ago so we start in "adult" and cycle progresses
  const effectiveStart =
    process.uptime() > 60 ? fallbackStart : Date.now() - 2 * HOUR
  try {
    const filePath = join(process.cwd(), FILENAME)
    writeFileSync(filePath, JSON.stringify({ startTime: effectiveStart }), "utf-8")
  } catch {
    // e.g. read-only filesystem (serverless); start time still valid for this process
  }
  return effectiveStart
}

export async function GET() {
  const startTime = getPersistedStartTime()
  return NextResponse.json({
    startTime,
    uptime: process.uptime(),
  })
}
