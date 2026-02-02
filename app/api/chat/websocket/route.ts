import { NextResponse } from "next/server"

// Next.js API routes (Vercel serverless) don't support persistent WebSockets.
// Use a separate WebSocket server (e.g. server/websocket-server.ts) for WS.
export function GET() {
  return NextResponse.json(
    {
      error: "WebSocket not available",
      message:
        "Use a dedicated WebSocket server. This endpoint is for documentation only.",
    },
    { status: 501 }
  )
}
