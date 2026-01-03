// WebSocket server with OpenSouls-Lite Runtime
import { WebSocketServer, WebSocket } from "ws"
import { createServer } from "http"
import OpenAI from "openai"
import dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"

// Load environment variables
dotenv.config({ path: ".env.local" })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// --- OpenSouls Lite Interfaces ---

interface SoulContext {
  conversationId: string
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>
  workingMemory: {
    name: string
    personality: string
  }
}

// Store active soul contexts
const activeSouls = new Map<string, SoulContext>()

// Helper to load the soul's static memory
async function loadSoulConfig() {
  try {
    const coreMemoryPath = path.join(process.cwd(), "opensouls-temp/souls/degen-otter/soul/staticMemories/core.md")
    const coreMemory = await fs.readFile(coreMemoryPath, "utf-8")
    return {
      name: "Degen Otter",
      personality: coreMemory
    }
  } catch (error) {
    console.error("Error loading soul config:", error)
    // Fallback if file not found
    console.log("Using fallback personality")
    return {
      name: "Degen Otter",
      personality: "You are a degen otter. You love crypto, memes, and trading. You are sometimes angry when the market dumps, and excited when it pumps."
    }
  }
}

export function createWebSocketServer(port: number = 8080) {
  const server = createServer()
  const wss = new WebSocketServer({ server })

  // Load soul config once on startup
  let soulConfig: { name: string; personality: string } | null = null
  loadSoulConfig().then(config => {
    soulConfig = config
    console.log("🦦 Degen Otter Soul Loaded!")
  })

  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection")
    let conversationId: string | null = null

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString())

        // 1. INITIALIZATION
        if (message.type === "init") {
          const id = message.conversationId || `conv-${Date.now()}`
          conversationId = id
          
          if (!activeSouls.has(id)) {
            activeSouls.set(id, {
              conversationId: id,
              history: [],
              workingMemory: soulConfig || { name: "Otter", personality: "Loading..." }
            })
          }

          ws.send(JSON.stringify({ type: "connected", conversationId: id }))
          return
        }

          // 2. MESSAGE PROCESSING (The "Cognitive Step")
        if (message.type === "message" && conversationId) {
          const userContent = message.content
          const context = activeSouls.get(conversationId)
          
          if (!context) {
            ws.send(JSON.stringify({ type: "error", error: "Session not found" }))
            return
          }
          
          // Extract mood and trend from client message
          // Default to neutral if not provided
          const mood = message.mood || "neutral"
          const trend = message.trend || "neutral"
          
          // Update History
          context.history.push({ role: "user", content: userContent })

          // Notify Client: Typing
          ws.send(JSON.stringify({ type: "typing", isTyping: true }))

          // Construct the OpenSouls-style System Prompt
          const systemPrompt = `
Model the mind of ${context.workingMemory.name}.

## Core Personality & Memories
${context.workingMemory.personality}

## Current Mood: ${mood.toUpperCase()}
## Market Trend: ${trend.toUpperCase()}
- If angry, be aggressive, annoyed, or short.
- If excited, be energetic, hype, and enthusiastic.
- If depressed, be gloomy, pessimistic, or low energy.
- DO NOT use emojis.

## Current Context
You are chatting with a user via WebSocket.
Reply to the user's last message.
DO NOT include internal thoughts or actions (e.g. *smiles*).
Just the spoken response.
`

          // Prepare messages for OpenAI
          const messages = [
            { role: "system" as const, content: systemPrompt },
            ...context.history.slice(-10) // Keep context window manageable
          ]

          // Execute the "ExternalDialog" Step
          const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Fast model for chat
            messages: messages,
            temperature: 0.9, // High creativity for the Otter
            max_tokens: 300,
            stream: true,
          })

          let fullResponse = ""

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              fullResponse += content
              ws.send(JSON.stringify({ type: "chunk", content }))
            }
          }

          // Update History with Assistant Response
          context.history.push({ role: "assistant", content: fullResponse })
          
          // Prune history if too long
          if (context.history.length > 20) {
            context.history = context.history.slice(-20)
          }

          // Finalize
          ws.send(JSON.stringify({ type: "complete", message: fullResponse, mood: mood }))
        }
      } catch (error: any) {
        console.error("WebSocket error:", error)
        ws.send(JSON.stringify({ type: "error", error: error.message || "An error occurred" }))
      }
    })

    ws.on("close", () => {
      // Optional: Cleanup inactive souls after timeout
    })
  })

  server.listen(port, () => {
    console.log(`WebSocket server running on ws://localhost:${port}`)
  })

  return { server, wss }
}

// For standalone server execution
const port = parseInt(process.env.WEBSOCKET_PORT || "8080", 10)
if (require.main === module) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not set in .env.local")
    process.exit(1)
  }
  createWebSocketServer(port)
}

