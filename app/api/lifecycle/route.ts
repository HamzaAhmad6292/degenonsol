import { NextResponse } from "next/server"

/** Start time = when this server process started. Cycle restarts on every server restart. */
function getServerStartTime(): number {
  return Date.now() - process.uptime() * 1000
}

export async function GET() {
  const startTime = getServerStartTime()
  return NextResponse.json({
    startTime,
    uptime: process.uptime(),
  })
}
