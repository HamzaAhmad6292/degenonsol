import { NextResponse } from "next/server"

// Calculate server start time once when the module loads
// This will be roughly when the Next.js server process started
const serverStartTime = Date.now() - (process.uptime() * 1000)

export async function GET() {
  return NextResponse.json({ 
    startTime: serverStartTime,
    uptime: process.uptime()
  })
}
