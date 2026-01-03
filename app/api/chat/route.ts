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
    const { message, conversationId } = await request.json()

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

    // Add user message
    conversationHistory.push({
      role: "user",
      content: message,
    })

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a cost-effective model, can be changed to gpt-4
      messages: conversationHistory,
      temperature: 0.8,
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
    })
  } catch (error: any) {
    console.error("Chat API error:", error)
    return Response.json(
      { error: error.message || "Failed to get response" },
      { status: 500 }
    )
  }
}

