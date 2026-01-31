import { NextRequest } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY not configured" },
        { status: 500 }
      )
    }

    const { imageDataUrl, question } = await req.json()

    if (!imageDataUrl || !question) {
      return Response.json(
        { error: "imageDataUrl and question are required" },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      // Vision-capable model
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a visual assistant that briefly describes what you see through the user's camera and answers their question. Be concise (1–3 sentences) and only talk about things visible in the image plus the question context.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: question,
            },
            {
              type: "image_url",
              image_url: {
                // The client sends a full data URL (data:image/jpeg;base64,...)
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    })

    const answer = completion.choices[0]?.message?.content?.trim() || ""

    return Response.json({
      answer,
    })
  } catch (error: any) {
    console.error("Vision analyze error:", error)
    return Response.json(
      { error: error.message || "Failed to analyze image" },
      { status: 500 }
    )
  }
}


