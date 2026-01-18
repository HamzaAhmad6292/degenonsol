import { NextRequest } from "next/server"
import { 
  getOtterExpression, 
  addOtterExpression, 
  MODELS,
  getVoiceIdForStage
} from "@/lib/elevenlabs"

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY

/**
 * ElevenLabs Streaming TTS with Audio Tags
 * 
 * Uses eleven_v3 model for full Audio Tag support
 * Automatically adds emotional expressions: [excited], [laughs], [sighs], etc.
 * 
 * Required env: ELEVENLABS_API_KEY
 * Optional env: ELEVENLABS_VOICE_ID (defaults to expressive female voice)
 */
export async function POST(req: NextRequest) {
  try {
    const { text, mood = 'neutral', lifecycleStage } = await req.json()

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Get the correct voice ID based on lifecycle stage
    const voiceId = getVoiceIdForStage(lifecycleStage)

    // Get mood-specific voice settings
    const { voiceSettings } = getOtterExpression(mood)
    
    // Add emotional expression tags to the text
    const expressiveText = addOtterExpression(text, mood)
    
    console.log(`[TTS] Mood: ${mood}, Stage: ${lifecycleStage}, Voice: ${voiceId}`)
    console.log(`[TTS] Input: "${text}"`)
    console.log(`[TTS] With tags: "${expressiveText}"`)

    // Call ElevenLabs streaming API with eleven_v3 model
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: expressiveText,
          model_id: MODELS.v3, // eleven_v3 - required for Audio Tags
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style || 0.3,
            use_speaker_boost: voiceSettings.use_speaker_boost !== false,
          },
          // Streaming optimization
          optimize_streaming_latency: 3, // 0-4, higher = lower latency
          output_format: "mp3_44100_128",
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs error:", response.status, errorText)
      
      // If v3 fails, try falling back to flash model
      console.log("Attempting fallback to flash model...")
      
      const fallbackResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text, // Use original text without tags for fallback
            model_id: MODELS.flash,
            voice_settings: {
              stability: voiceSettings.stability,
              similarity_boost: voiceSettings.similarity_boost,
            },
            optimize_streaming_latency: 4,
            output_format: "mp3_44100_128",
          }),
        }
      )

      if (!fallbackResponse.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`)
      }

      return new Response(fallbackResponse.body, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
          "X-Model": "eleven_flash_v2_5",
          "X-Mood": mood,
        },
      })
    }

    // Stream the audio response
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Model": "eleven_v3",
        "X-Mood": mood,
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
