import { NextRequest, NextResponse } from "next/server"
import { 
  getOtterExpression, 
  addOtterExpression, 
  MODELS,
  getVoiceIdForStage
} from "@/lib/elevenlabs"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

/**
 * ElevenLabs TTS with Audio Tags (Non-streaming)
 * 
 * For lower latency, use /api/tts/stream instead.
 * This returns the complete audio file.
 */
export async function POST(req: NextRequest) {
  try {
    const { text, mood = 'neutral', lifecycleStage } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    if (!ELEVENLABS_API_KEY) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Get mood-specific voice settings
    const { voiceSettings } = getOtterExpression(mood)
    
    // Add emotional expression tags
    const expressiveText = addOtterExpression(text, mood)

    // Get the correct voice ID based on lifecycle stage
    const voiceId = getVoiceIdForStage(lifecycleStage)

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: expressiveText,
          model_id: MODELS.v3,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style ?? 0.3,
            use_speaker_boost: voiceSettings.use_speaker_boost ?? true,
          },
          output_format: "mp3_44100_128",
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs error:", response.status, errorText)
      throw new Error(`ElevenLabs API error: ${response.status}`)
    }

    const audioBuffer = await response.arrayBuffer()

    return new NextResponse(Buffer.from(audioBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    })
  } catch (error: any) {
    console.error("TTS Error:", error)
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
