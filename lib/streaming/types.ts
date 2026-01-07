// Streaming types for LLM and TTS

export interface StreamChunk {
  type: 'text' | 'audio' | 'done' | 'error'
  content?: string
  audio?: string // base64 encoded audio chunk
  error?: string
}

export interface StreamingConfig {
  onTextChunk?: (text: string) => void
  onAudioChunk?: (audioBase64: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: string) => void
  enableTTS?: boolean
}

export interface ChatStreamRequest {
  message: string
  conversationId: string
  mood?: string
  trend?: string
  enableTTS?: boolean
}

export interface TTSConfig {
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  speed: number
}

export function getMoodTTSConfig(mood: string): TTSConfig {
  const voice = 'nova' as const
  let speed = 1.0

  switch (mood) {
    case 'angry':
      speed = 1.3
      break
    case 'happy':
    case 'excited':
      speed = 1.15
      break
    case 'depressed':
    case 'sad':
      speed = 0.85
      break
    default:
      speed = 1.05
      break
  }

  return { voice, speed }
}
