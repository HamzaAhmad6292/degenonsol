import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" })

export interface NameAgentResult {
  nameProvided: boolean
  name: string | null
}

/**
 * Determine if the user has just provided the name they want to be called.
 * Uses LLM only; no regex or pattern matching.
 */
export async function detectName(
  userMessage: string,
  recentTurns: { role: "user" | "assistant"; content: string }[]
): Promise<NameAgentResult> {
  if (!process.env.OPENAI_API_KEY) return { nameProvided: false, name: null }

  const systemPrompt = `You are a classifier with one job: determine whether the user has just provided the name they want to be called. Consider the full conversation context — for example, if the assistant recently asked "What should I call you?" and the user responded, that response likely contains their name. Do not apply rules or patterns. Use contextual understanding. Output ONLY valid JSON with exactly two keys: "nameProvided" (boolean) and "name" (string or null). If the user provided a name, set name to that name only (trim whitespace, title-case). If not, set nameProvided to false and name to null.`

  const userPrompt = `Recent conversation:\n${JSON.stringify(recentTurns)}\n\nUser's latest message: "${userMessage}"\n\nDid the user provide a name they want to be called? If yes, what is that name? Reply with JSON only: {"nameProvided": true/false, "name": "..." or null}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 100,
      response_format: { type: "json_object" },
    })
    const raw = completion.choices[0]?.message?.content?.trim()
    if (!raw) return { nameProvided: false, name: null }
    const parsed = JSON.parse(raw) as { nameProvided?: boolean; name?: string | null }
    const nameProvided = Boolean(parsed.nameProvided)
    const name =
      nameProvided && parsed.name && typeof parsed.name === "string"
        ? parsed.name.trim().replace(/\s+/g, " ") || null
        : null
    if (name) {
      const titleCased = name.replace(/\b\w/g, (c) => c.toUpperCase())
      return { nameProvided: true, name: titleCased }
    }
    return { nameProvided: false, name: null }
  } catch {
    return { nameProvided: false, name: null }
  }
}
