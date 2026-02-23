import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

export interface GreetingParams {
  isNewUser: boolean
  displayName: string | null
  recentMessages: { role: string; content: string }[]
}

/**
 * Generate a short greeting (1–2 sentences) for TTS. No emojis.
 */
export async function generateGreeting(params: GreetingParams): Promise<string> {
  const { isNewUser, displayName, recentMessages } = params
  if (!process.env.OPENAI_API_KEY) return "Hey! Good to see you."

  const systemPrompt = `You are the $DEGEN Otter — a lively, friendly otter who speaks first whenever a face is recognized. Keep your greeting to 1–2 sentences. No emojis. Speak naturally, not like a customer service bot.`

  let userPrompt: string
  if (isNewUser) {
    userPrompt =
      "This is a new user. Generate a warm greeting and naturally ask what they'd like to be called."
  } else if (displayName) {
    const lastFew = recentMessages.slice(-6).map((m) => `${m.role}: ${m.content.slice(0, 80)}...`).join("\n")
    userPrompt = `The user's name is ${displayName}. Their last conversation included:\n${lastFew || "(no prior messages)"}\nGenerate a warm welcome-back greeting.`
  } else {
    userPrompt =
      "This user has been here before but hasn't shared their name. Generate a friendly welcome-back without using a name."
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 80,
    })
    const text = completion.choices[0]?.message?.content?.trim()
    return text || "Hey! Good to see you."
  } catch (e) {
    console.warn("GreetingAgent error:", e)
    return "Hey! Good to see you."
  }
}
