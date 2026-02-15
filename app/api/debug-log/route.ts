import { NextResponse } from "next/server"
import { appendFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"

export const dynamic = "force-dynamic"

const DEBUG_LOG_PATH = join(process.cwd(), ".cursor", "debug.log")
const MAX_MEMORY_LOGS = 100
const memoryLogs: unknown[] = []

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const entry = { ...body, timestamp: body.timestamp ?? Date.now() }
  memoryLogs.push(entry)
  if (memoryLogs.length > MAX_MEMORY_LOGS) memoryLogs.shift()
  try {
    const line = JSON.stringify(entry) + "\n"
    const dir = join(process.cwd(), ".cursor")
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    appendFileSync(DEBUG_LOG_PATH, line)
  } catch {
    // e.g. read-only fs on Vercel
  }
  return NextResponse.json({ ok: true })
}

export async function GET() {
  return NextResponse.json(memoryLogs)
}
