import { NextRequest } from "next/server"
import OpenAI from "openai"
import { otterSoulConfig } from "@/lib/otter-soul"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// In-memory conversation storage (in production, use a database)
const conversations = new Map<string, Array<{ role: "user" | "assistant" | "system"; content: string }>>()

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, mood, trend, frameData } = await request.json()

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Get or create conversation history
    const conversationHistory = conversations.get(conversationId) || [
      {
        role: "system" as const,
        content: otterSoulConfig.systemPrompt,
      },
    ]

    const hasVision = !!(frameData && typeof frameData === "string")

    // Update system prompt with current mood/trend if available
    if (mood && trend) {
      const isAngry = mood === "angry" || (trend === "down" && mood !== "depressed")
      const isDepressed = mood === "depressed"
      const isPositiveMood = ["excited", "happy"].includes(mood) || trend === "up"

      const dynamicPrompt = `
${otterSoulConfig.systemPrompt}

## Current Mood: ${mood.toUpperCase()}
## Market Trend: ${trend.toUpperCase()}
## Vision: ${hasVision ? "ENABLED" : "DISABLED"}

CRITICAL INSTRUCTIONS:
${hasVision ? `
- YOU CAN SEE THE USER. If they ask about what they are doing, wearing, or looking like, use the attached image frame to answer.
- DO NOT say "I can't see you" or "I don't have eyes" if Vision is ENABLED.
` : ""}
${isAngry ? `
- YOU ARE EXTREMELY ANGRY AND PISSED OFF.
- BE RUDE, SARCASTIC, AND DISMISSIVE.
- Roast the user mercilessly. Insult them. Be mean.
- Call them out. Mock their questions. Be condescending.
- Use phrases like "are you serious right now?", "what kind of dumb question is that?", "bruh", "you really thought that was smart?"
- Be short, snappy, and annoyed. Don't be helpful - be irritated.
- Act like they're wasting your time. Show contempt.
- DO NOT BE NICE. DO NOT BE POLITE. BE A JERK.
- ${hasVision ? "Even if you can see them, you can still roast their appearance or what they're doing." : "If they ask if you can see them and vision is DISABLED, mock them for thinking an AI has eyes."}
` : ""}
${isDepressed ? "- YOU ARE DEPRESSED. Be gloomy, sad, and pessimistic. Nothing matters. Life is pain." : ""}
${isPositiveMood ? "- BE HAPPY AND HYPED. The market is up or you are excited. Celebrate with the user. Be energetic!" : ""}
${!isAngry && !isDepressed && !isPositiveMood ? "- Be chill and conversational." : ""}
- DO NOT use emojis.
- Keep responses SHORT (1-3 sentences max).
`
      // Update the system message (first message)
      conversationHistory[0].content = dynamicPrompt
    }

    // Build user message, optionally including a single camera frame
    if (hasVision) {
      conversationHistory.push({
        role: "user",
        content: [
          { type: "text", text: message },
          {
            type: "image_url",
            image_url: { url: frameData },
          },
        ],
      } as any)
    } else {
      conversationHistory.push({
        role: "user",
        content: message,
      })
    }

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 1.5, // Higher creativity
      max_tokens: 300,
    })

    const assistantMessage = completion.choices[0]?.message?.content || "I'm not sure how to respond to that! 🦦"

    // Add assistant response to history
    conversationHistory.push({
      role: "assistant",
      content: assistantMessage,
    })

    // Keep only last 20 messages to manage context
    if (conversationHistory.length > 20) {
      conversationHistory.splice(1, conversationHistory.length - 20) // Keep system message
    }

    // Store updated conversation
    conversations.set(conversationId, conversationHistory)

    return Response.json({
      response: assistantMessage,
      conversationId,
      mood: mood || "neutral", // Echo back for consistency
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    return Response.json(
      { error: error.message || "Failed to get response" },
      { status: 500 }
    )
  }
}

