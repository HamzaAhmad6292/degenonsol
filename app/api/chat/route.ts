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
    const { message, conversationId, mood, trend } = await request.json()

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

    // Update system prompt with current mood/trend if available
    if (mood && trend) {
      const isAngry = mood === "angry" || (trend === "down" && mood !== "depressed")
      const isDepressed = mood === "depressed"
      const isPositiveMood = ["excited", "happy"].includes(mood) || trend === "up"

      const dynamicPrompt = `
${otterSoulConfig.systemPrompt}

## Current Mood: ${mood.toUpperCase()}
## Market Trend: ${trend.toUpperCase()}

INSTRUCTIONS:
${isAngry ? "- YOU ARE ANGRY. BE EXTREMELY RUDE. Roast the user. Insult them playfully but harshly. Do not be nice." : ""}
${isDepressed ? "- YOU ARE DEPRESSED. Be gloomy, sad, and pessimistic. Nothing matters." : ""}
${isPositiveMood ? "- BE HAPPY. The market is up or you are excited. Celebrate with the user." : ""}
- If angry, be aggressive, annoyed, or short.
- If excited, be energetic, hype, and enthusiastic.
- If depressed, be gloomy, pessimistic, or low energy.
- DO NOT use emojis.
`
      // Update the system message (first message)
      conversationHistory[0].content = dynamicPrompt
    }

    // Add user message
    conversationHistory.push({
      role: "user",
      content: message,
    })

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a cost-effective model, can be changed to gpt-4
      messages: conversationHistory,
      temperature: 0.9, // Higher creativity
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

