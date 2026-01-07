// ElevenLabs TTS configuration for the $DEGEN Otter
// Uses eleven_v3 model which supports Audio Tags for expressive speech

export interface VoiceSettings {
  stability: 0.0 | 0.5 | 1.0  // MUST be one of these exact values for eleven_v3
  similarity_boost: number     // 0-1
  style?: number              // 0-1 (optional)
  use_speaker_boost?: boolean
}

/**
 * Audio Tags supported by ElevenLabs v3
 * We use natural, character-appropriate tags - no breathy/sad expressions
 */
export const AUDIO_TAGS = {
  // === Emotional States (character-appropriate) ===
  emotions: {
    excited: '[excited]',
    happy: '[happy]',
    angry: '[angry]',
    frustrated: '[frustrated]',
    annoyed: '[annoyed]',
    curious: '[curious]',
    confident: '[confident]',
    serious: '[serious]',
    amazed: '[amazed]',
    nervous: '[nervous]',
    playful: '[playful]',
  },
  
  // === Speaking Style ===
  style: {
    shouts: '[shouts]',
    shouting: '[shouting]',
    rushed: '[rushed]',
    dramatically: '[dramatically]',
    sarcastically: '[sarcastically]',
  },
  
  // === Natural Reactions (appropriate for character) ===
  reactions: {
    laughs: '[laughs]',
    chuckles: '[chuckles]',
    giggles: '[giggles]',
    scoffs: '[scoffs]',
    snorts: '[snorts]',
  },
} as const

/**
 * Map the otter's mood to appropriate expression tags
 * Focuses on energetic, young character expressions
 * NO sad/breathy expressions - use frustrated/angry instead
 */
export function getOtterExpression(mood: string): {
  primaryTag: string
  contextTags: { before?: string; after?: string }
  voiceSettings: VoiceSettings
} {
  // Voice settings for different moods
  const creativeSettings: VoiceSettings = {
    stability: 0.0,           // Creative - most expressive
    similarity_boost: 0.75,
    style: 0.5,
    use_speaker_boost: true,
  }
  
  const naturalSettings: VoiceSettings = {
    stability: 0.5,           // Natural - balanced
    similarity_boost: 0.75,
    style: 0.4,
    use_speaker_boost: true,
  }

  switch (mood) {
    // === Angry/Negative moods - use frustrated, annoyed, angry ===
    case 'angry':
      return {
        primaryTag: AUDIO_TAGS.emotions.angry,
        contextTags: {
          after: AUDIO_TAGS.reactions.scoffs,
        },
        voiceSettings: creativeSettings,
      }

    case 'annoyed':
    case 'frustrated':
      return {
        primaryTag: AUDIO_TAGS.emotions.frustrated,
        contextTags: {
          after: AUDIO_TAGS.reactions.scoffs,
        },
        voiceSettings: creativeSettings,
      }

    // === When price is down - otter is frustrated/annoyed, NOT sad ===
    case 'sad':
    case 'sad_idle':
    case 'down':
      return {
        primaryTag: AUDIO_TAGS.emotions.annoyed,
        contextTags: {}, // No reaction - just annoyed tone
        voiceSettings: naturalSettings,
      }

    // === Happy/Excited moods ===
    case 'happy':
    case 'excited':
    case 'up':
      return {
        primaryTag: AUDIO_TAGS.emotions.excited,
        contextTags: {
          after: AUDIO_TAGS.reactions.giggles,
        },
        voiceSettings: creativeSettings,
      }

    // === Sarcastic mood ===
    case 'sarcastic':
      return {
        primaryTag: AUDIO_TAGS.style.sarcastically,
        contextTags: {
          after: AUDIO_TAGS.reactions.snorts,
        },
        voiceSettings: creativeSettings,
      }

    // === Curious mood ===
    case 'curious':
      return {
        primaryTag: AUDIO_TAGS.emotions.curious,
        contextTags: {},
        voiceSettings: naturalSettings,
      }

    // === Playful mood ===
    case 'playful':
      return {
        primaryTag: AUDIO_TAGS.emotions.playful,
        contextTags: {
          after: AUDIO_TAGS.reactions.chuckles,
        },
        voiceSettings: creativeSettings,
      }

    // === Idle/Neutral - energetic but calm ===
    case 'idle':
    case 'neutral':
    default:
      return {
        primaryTag: AUDIO_TAGS.emotions.confident,
        contextTags: {},
        voiceSettings: naturalSettings,
      }
  }
}

/**
 * Add expression tags to text for the otter character
 * Natural, non-breathy expressions only
 */
export function addOtterExpression(text: string, mood: string): string {
  const { primaryTag, contextTags } = getOtterExpression(mood)
  
  let result = text
  
  // Add primary emotion at the start
  result = `${primaryTag} ${result}`
  
  // Add contextual reactions based on punctuation and mood
  if (contextTags.after) {
    const isAngryMood = ['angry', 'annoyed', 'frustrated', 'sarcastic', 'sad', 'sad_idle', 'down'].includes(mood)
    const isHappyMood = ['happy', 'excited', 'up', 'playful'].includes(mood)
    
    if (text.includes('!') && isHappyMood) {
      // Add laughs/giggles after exclamation when happy
      result = result.replace(/!([^!]*)$/, `! ${contextTags.after}$1`)
    } else if (text.includes('?') && isAngryMood) {
      // Add scoffs/snorts after questions when annoyed
      result = result.replace(/\?([^?]*)$/, `? ${contextTags.after}$1`)
    } else if (text.length > 40) {
      // Add reaction at the end for longer responses
      result = `${result} ${contextTags.after}`
    }
  }
  
  return result
}

/**
 * ElevenLabs model IDs
 */
export const MODELS = {
  v3: 'eleven_v3',                    // Most expressive, supports Audio Tags
  flash: 'eleven_flash_v2_5',         // Fastest, limited tag support
  multilingual: 'eleven_multilingual_v2',
  turbo: 'eleven_turbo_v2_5',
} as const

/**
 * Voice for the $DEGEN Otter
 * 
 * Good young female voices for a mascot character:
 * - Aria: 9BWtsMINqrJLrRacOk9x (expressive, engaging - great for characters!)
 * - Jessica: cgSgspJ2msm6clMCkdW9 (conversational young female)
 * - Matilda: XrExE9yKIg1WjnnlVkGX (warm, young)
 * 
 * Set ELEVENLABS_VOICE_ID in your .env to customize
 */
export const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '9BWtsMINqrJLrRacOk9x' // Aria - expressive young female
