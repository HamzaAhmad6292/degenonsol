// WebSocket server for OpenSouls chat integration
// Run this as a separate server or integrate with Next.js custom server

import { WebSocketServer, WebSocket } from "ws"
import { createServer } from "http"
import OpenAI from "openai"
import { otterSoulConfig } from "../lib/otter-soul"
import dotenv from "dotenv"

// Load environment variables
dotenv.config({ path: ".env.local" })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// Store conversations in memory (use Redis or database in production)
const conversations = new Map<
  string,
  Array<{ role: "user" | "assistant" | "system"; content: string }>
>()

export function createWebSocketServer(port: number = 8080) {
  const server = createServer()
  const wss = new WebSocketServer({ server })

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection")

    let conversationId: string | null = null

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        if (message.type === "init") {
          conversationId = message.conversationId || `conv-${Date.now()}`
          
          // Initialize conversation
          if (!conversations.has(conversationId)) {
            conversations.set(conversationId, [
              {
                role: "system",
                content: otterSoulConfig.systemPrompt,
              },
            ])
          }

          ws.send(
            JSON.stringify({
              type: "connected",
              conversationId,
            })
          )
          return
        }

        if (message.type === "message" && conversationId) {
          const userMessage = message.content

          // Get conversation history
          const conversationHistory = conversations.get(conversationId) || [
            {
              role: "system" as const,
              content: otterSoulConfig.systemPrompt,
            },
          ]

          // Add user message
          conversationHistory.push({
            role: "user",
            content: userMessage,
          })

          // Send typing indicator
          ws.send(
            JSON.stringify({
              type: "typing",
              isTyping: true,
            })
          )

          // Call OpenAI API with streaming
          const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationHistory,
            temperature: 0.8,
            max_tokens: 300,
            stream: true,
          })

          let fullResponse = ""

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              fullResponse += content
              ws.send(
                JSON.stringify({
                  type: "chunk",
                  content,
                })
              )
            }
          }

          // Add assistant response to history
          conversationHistory.push({
            role: "assistant",
            content: fullResponse,
          })

          // Keep only last 20 messages
          if (conversationHistory.length > 20) {
            conversationHistory.splice(1, conversationHistory.length - 20)
          }

          conversations.set(conversationId, conversationHistory)

          // Send completion
          ws.send(
            JSON.stringify({
              type: "complete",
              message: fullResponse,
            })
          )
        }
      } catch (error: any) {
        console.error("WebSocket error:", error)
        ws.send(
          JSON.stringify({
            type: "error",
            error: error.message || "An error occurred",
          })
        )
      }
    })

    ws.on("close", () => {
      console.log("WebSocket connection closed")
    })

    ws.on("error", (error) => {
      console.error("WebSocket error:", error)
    })
  })

  server.listen(port, () => {
    console.log(`WebSocket server running on ws://localhost:${port}`)
  })

  return { server, wss }
}

// For standalone server - will be called by tsx
const port = parseInt(process.env.WEBSOCKET_PORT || "8080", 10)
if (!process.env.OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set in .env.local")
  console.error("Please create .env.local file with your OpenAI API key")
  process.exit(1)
}
createWebSocketServer(port)

