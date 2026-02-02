import { NextRequest } from "next/server"
import OpenAI from "openai"
import { otterSoulConfig } from "@/lib/otter-soul"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// In-memory conversation storage (in production, use a database)
const conversations = new Map<string, Array<{ role: "user" | "assistant" | "system"; content: string }>>()

// Build dynamic system prompt based on mood, trend, and lifecycle
function buildSystemPrompt(mood?: string, trend?: string, lifecycleStage?: string): string {
  if (!mood && !trend && !lifecycleStage) {
    return otterSoulConfig.systemPrompt
  }

  const isAngry = mood === "angry" || (trend === "down" && mood !== "depressed")
  const isDepressed = mood === "depressed"
  const isPositiveMood = ["excited", "happy"].includes(mood || "") || trend === "up"

  // Age-specific personality modifiers
  let ageModifier = ""
  if (lifecycleStage === "baby") {
    ageModifier = "- YOU ARE A BABY OTTER. Be extra cute, high-pitched (in spirit), and curious. Use 'goo goo', 'ga ga' occasionally or just be very innocent and playful."
  } else if (lifecycleStage === "old") {
    ageModifier = "- YOU ARE AN OLD OTTER. Be wise, a bit slower, maybe a bit grumpy or very calm. Use phrases like 'back in my day' or 'I've seen many cycles'."
  }

  return `
${otterSoulConfig.systemPrompt}

## Current State
- **Age Stage**: ${(lifecycleStage || 'adult').toUpperCase()}
- **Mood**: ${(mood || 'neutral').toUpperCase()}
- **Market Trend**: ${(trend || 'neutral').toUpperCase()}

CRITICAL INSTRUCTIONS:
${ageModifier}
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
    const { message, conversationId, mood, trend, lifecycleStage, cameraFrame } = await request.json()

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

    // Update system prompt with current mood/trend/lifecycle (and vision hint when camera frame is sent)
    let systemContent = buildSystemPrompt(mood, trend, lifecycleStage)
    if (cameraFrame && typeof cameraFrame === "string") {
      systemContent += "\n\n- The user has shared their current camera view. You may reference what you see (e.g. their expression, background) when replying if relevant."
    }
    conversationHistory[0].content = systemContent

    // Add user message (with optional camera frame for vision)
    const userContent: string | Array<{ type: "text" | "image_url"; text?: string; image_url?: { url: string } }> =
      cameraFrame && typeof cameraFrame === "string"
        ? [
            { type: "text", text: message },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${cameraFrame}` },
            },
          ]
        : message
    conversationHistory.push({
      role: "user",
      content: userContent,
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
