import { NextRequest } from "next/server"

// ElevenLabs streaming TTS endpoint
// This uses ElevenLabs' streaming API for ultra-low-latency TTS
// Audio starts playing before the full text is processed

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM" // Rachel voice

export async function POST(req: NextRequest) {
  try {
    const { text, mood } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // If no ElevenLabs key, fall back to OpenAI
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Adjust voice settings based on mood
    let stability = 0.5
    let similarityBoost = 0.75
    let style = 0.0
    
    switch (mood) {
      case "angry":
        stability = 0.3
        similarityBoost = 0.8
        style = 0.5
        break
      case "happy":
      case "excited":
        stability = 0.4
        similarityBoost = 0.8
        style = 0.3
        break
      case "depressed":
      case "sad":
        stability = 0.7
        similarityBoost = 0.6
        style = 0.1
        break
      default:
        stability = 0.5
        similarityBoost = 0.75
        style = 0.0
    }

    // Use streaming endpoint for lowest latency
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2", // Fastest model
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("ElevenLabs error:", error)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    // Stream the audio response directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error: any) {
    console.error("ElevenLabs TTS Error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal Server Error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
