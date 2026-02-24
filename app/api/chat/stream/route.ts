import { NextRequest } from "next/server"
import OpenAI from "openai"
import { otterSoulConfig } from "@/lib/otter-soul"
import {
  extractSolanaWalletFromText,
  fetchDegenBalanceForWallet,
  formatWalletBalanceForContext,
} from "@/lib/wallet-degen"
import { detectName } from "@/lib/agents/name-agent"
import {
  getDisplayName,
  getRecentMessages,
  persistMessage,
  updateDisplayName,
} from "@/lib/face-db"

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

// In-memory conversation storage (in production, use a database)
const conversations = new Map<string, Array<{ role: "user" | "assistant" | "system"; content: string }>>()

// Build dynamic system prompt based on mood, trend, lifecycle, wallet balance, and weather context
function buildSystemPrompt(
  mood?: string,
  trend?: string,
  lifecycleStage?: string,
  hasVision: boolean = false,
  walletBalanceContext?: string,
  weatherContext?: string
): string {
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

  const walletBlock = walletBalanceContext
    ? `

## User wallet (only when they shared it in this message)
${walletBalanceContext}
`
    : ""

  const weatherBlock = weatherContext
    ? `

## Weather and prices (you feel and know this)
${weatherContext}
- You have the prices and percentages above. Mention them naturally when useful (example: "DEGEN is up 3%", "BTC's windy today", "SOL fog is clearing").
- Weather mapping: BTC = macro sky/wind mood, SOL = local fog/temperature mood.
- Explain weather/market in plain language and playful metaphors, not technical jargon.
- Keep weather references short, funny, and in character.
`
    : ""

  if (!mood && !trend && !lifecycleStage && !hasVision && !walletBalanceContext && !weatherContext) {
    return otterSoulConfig.systemPrompt + (walletBlock || "") + (weatherBlock || "")
  }

  return `
${otterSoulConfig.systemPrompt}
${walletBlock}
${weatherBlock}

## Current State
- **Age Stage**: ${(lifecycleStage || 'adult').toUpperCase()}
- **Mood**: ${(mood || 'neutral').toUpperCase()}
- **Market Trend**: ${(trend || 'neutral').toUpperCase()}
- **Vision**: ${hasVision ? "ENABLED (You can see a frame from the user's camera attached to their message)" : "DISABLED"}

CRITICAL INSTRUCTIONS:
${ageModifier}
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
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationId, mood, trend, lifecycleStage, frameData, userId, weatherContext } =
      await request.json() as {
        message: string
        conversationId: string
        mood?: string
        trend?: string
        lifecycleStage?: string
        frameData?: string
        userId?: string
        weatherContext?: string
      }

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const hasVision = !!(frameData && typeof frameData === "string")
    let conversationHistory: Array<{ role: "user" | "assistant" | "system"; content: string | unknown }>
    let displayNameAtStart: string | null = null

    if (userId && conversationId) {
      try {
        displayNameAtStart = await getDisplayName(userId)
        const dbMessages = await getRecentMessages(conversationId, 30)
        conversationHistory = [
          { role: "system" as const, content: otterSoulConfig.systemPrompt },
          ...dbMessages.map((m) => ({ role: m.role, content: m.content })),
        ]
      } catch {
        conversationHistory = [
          { role: "system" as const, content: otterSoulConfig.systemPrompt },
        ]
      }
    } else {
      conversationHistory = conversations.get(conversationId) || [
        {
          role: "system" as const,
          content: otterSoulConfig.systemPrompt,
        },
      ]
    }

    // When user explicitly mentions a Solana wallet, fetch $DEGEN balance and add to context for the LLM
    let walletBalanceContext: string | undefined
    const userMessageText = typeof message === "string" ? message : ""
    const wallet = extractSolanaWalletFromText(userMessageText)
    if (wallet) {
      const balanceResult = await fetchDegenBalanceForWallet(wallet)
      if (balanceResult) walletBalanceContext = formatWalletBalanceForContext(balanceResult)
    }

    const nameLine = userId
      ? displayNameAtStart
        ? `\n\nThe user's name is ${displayNameAtStart}. Use it naturally.`
        : "\n\nYou don't know the user's name yet. Ask naturally once."
      : ""
    conversationHistory[0].content =
      buildSystemPrompt(mood, trend, lifecycleStage, hasVision, walletBalanceContext, weatherContext) + nameLine

    // Build user message, optionally including a single camera frame
    if (frameData && typeof frameData === "string") {
      // Vision-style message with both text and image
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

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 1.2, // Higher creativity & humor, more varied and surprising replies
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

          // Store updated conversation (in-memory when no userId)
          conversations.set(conversationId, conversationHistory)

          // Persist to DB and run NameAgent when userId is set
          if (userId && conversationId) {
            try {
              await persistMessage(conversationId, "user", userMessageText)
              await persistMessage(conversationId, "assistant", fullResponse)
              if (displayNameAtStart === null) {
                const recentTurns = conversationHistory
                  .slice(1)
                  .filter((m): m is { role: "user" | "assistant"; content: string } => m.role !== "system" && typeof m.content === "string")
                  .slice(-6)
                const nameResult = await detectName(userMessageText, recentTurns)
                if (nameResult.nameProvided && nameResult.name) {
                  await updateDisplayName(userId, nameResult.name)
                  const nameStoredData = JSON.stringify({
                    type: "name_stored",
                    name: nameResult.name,
                  })
                  controller.enqueue(encoder.encode(`data: ${nameStoredData}\n\n`))
                }
              }
            } catch (e) {
              console.warn("Face persistence/NameAgent error:", e)
            }
          }

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
