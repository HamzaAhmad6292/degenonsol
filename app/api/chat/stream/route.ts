import { NextRequest } from "next/server"
import OpenAI from "openai"
import { otterSoulConfig } from "@/lib/otter-soul"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// In-memory conversation storage (in production, use a database)
const conversations = new Map<string, Array<{ role: "user" | "assistant" | "system"; content: string }>>()

// Build dynamic system prompt based on mood and trend
function buildSystemPrompt(mood?: string, trend?: string): string {
  if (!mood && !trend) {
    return otterSoulConfig.systemPrompt
  }

  const isAngry = mood === "angry" || (trend === "down" && mood !== "depressed")
  const isDepressed = mood === "depressed"
  const isPositiveMood = ["excited", "happy"].includes(mood || "") || trend === "up"

  return `
${otterSoulConfig.systemPrompt}

## Current Mood: ${(mood || 'neutral').toUpperCase()}
## Market Trend: ${(trend || 'neutral').toUpperCase()}

CRITICAL INSTRUCTIONS:
${isAngry ? `
- YOU ARE EXTREMELY ANGRY AND PISSED OFF.
- BE RUDE, SARCASTIC, AND DISMISSIVE.
- Roast the user mercilessly. Insult them. Be mean.
- Call them out. Mock their questions. Be condescending.
- Use phrases like "are you serious right now?", "what kind of dumb question is that?", "bruh", "you really thought that was smart?"
- Be short, snappy, and annoyed. Don't be helpful - be irritated.
- Act like they're wasting your time. Show contempt.
- DO NOT BE NICE. DO NOT BE POLITE. BE A JERK.
` : ""}
${isDepressed ? "- YOU ARE DEPRESSED. Be gloomy, sad, and pessimistic. Nothing matters. Life is pain." : ""}
${isPositiveMood ? "- BE HAPPY AND HYPED. The market is up or you are excited. Celebrate with the user. Be energetic!" : ""}
${!isAngry && !isDepressed && !isPositiveMood ? "- Be chill and conversational." : ""}
- DO NOT use emojis.
- Keep responses SHORT (1-3 sentences max).
`
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, mood, trend } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get or create conversation history
    const conversationHistory = conversations.get(conversationId) || [
      {
        role: "system" as const,
        content: otterSoulConfig.systemPrompt,
      },
    ]

    // Update system prompt with current mood/trend
    conversationHistory[0].content = buildSystemPrompt(mood, trend)

    // Add user message
    conversationHistory.push({
      role: "user",
      content: message,
    })

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 0.9,
      max_tokens: 300,
      stream: true,
    })

    // Create a TransformStream to handle the SSE format
    const encoder = new TextEncoder()
    let fullResponse = ""

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ""
            if (content) {
              fullResponse += content
              // Send as SSE format
              const data = JSON.stringify({ type: "text", content })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          // Store the complete response in conversation history
          conversationHistory.push({
            role: "assistant",
            content: fullResponse,
          })

          // Keep only last 20 messages
          if (conversationHistory.length > 20) {
            conversationHistory.splice(1, conversationHistory.length - 20)
          }

          // Store updated conversation
          conversations.set(conversationId, conversationHistory)

          // Send done event
          const doneData = JSON.stringify({ type: "done", content: fullResponse })
          controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
          controller.close()
        } catch (error: any) {
          const errorData = JSON.stringify({ type: "error", error: error.message })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("Chat Stream API error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Failed to get response" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
