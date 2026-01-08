// Utility to split streaming text into small speakable chunks for low-latency TTS
// Instead of waiting for full sentences, we process smaller phrases

export class PhraseSplitter {
  private buffer: string = ''
  private minChunkLength: number
  private maxChunkLength: number

  // Natural break points for speech
  private breakPatterns = /([.!?,:;])\s+|(\s+[-–—]\s+)|(\n)/

  constructor(minChunkLength: number = 15, maxChunkLength: number = 60) {
    this.minChunkLength = minChunkLength
    this.maxChunkLength = maxChunkLength
  }

  /**
   * Add text to the buffer and return any speakable chunks
   * Returns chunks as soon as they're large enough or hit a natural break
   * Optimized for low-latency TTS streaming
   */
  addChunk(text: string): string[] {
    this.buffer += text
    const chunks: string[] = []

    while (this.buffer.length > 0) {
      // If buffer has enough content, look for a break point
      if (this.buffer.length >= this.minChunkLength) {
        // Look for natural break points
        const match = this.buffer.match(this.breakPatterns)
        
        if (match && match.index !== undefined) {
          const breakIndex = match.index + match[0].length
          
          // Split at break point if chunk is meaningful (lower threshold for faster TTS)
          if (breakIndex >= Math.min(this.minChunkLength, 8) || this.buffer.length > this.maxChunkLength) {
            const chunk = this.buffer.slice(0, breakIndex).trim()
            if (chunk.length > 0) {
              chunks.push(chunk)
            }
            this.buffer = this.buffer.slice(breakIndex)
            continue
          }
        }
        
        // Force split if too long (find a space)
        if (this.buffer.length > this.maxChunkLength) {
          const spaceIndex = this.buffer.lastIndexOf(' ', this.maxChunkLength)
          if (spaceIndex > Math.min(this.minChunkLength, 8)) {
            const chunk = this.buffer.slice(0, spaceIndex).trim()
            if (chunk.length > 0) {
              chunks.push(chunk)
            }
            this.buffer = this.buffer.slice(spaceIndex + 1)
            continue
          }
        }
      }
      
      // Not enough content yet, wait for more
      break
    }

    return chunks
  }

  /**
   * Flush any remaining text in the buffer
   */
  flush(): string | null {
    const remaining = this.buffer.trim()
    this.buffer = ''
    return remaining.length > 0 ? remaining : null
  }

  /**
   * Reset the buffer
   */
  reset(): void {
    this.buffer = ''
  }

  /**
   * Get current buffer content (for debugging)
   */
  getBuffer(): string {
    return this.buffer
  }
}

/**
 * Legacy: Split text into sentences (for batch processing)
 */
export class SentenceSplitter {
  private buffer: string = ''

  addChunk(text: string): string[] {
    this.buffer += text
    const sentences: string[] = []

    while (true) {
      const match = this.buffer.match(/^([\s\S]*?[.!?]+)\s+([\s\S]*)$/)
      
      if (match) {
        const sentence = match[1].trim()
        if (sentence.length > 0) {
          sentences.push(sentence)
        }
        this.buffer = match[2]
      } else {
        break
      }
    }

    return sentences
  }

  flush(): string | null {
    const remaining = this.buffer.trim()
    this.buffer = ''
    return remaining.length > 0 ? remaining : null
  }

  reset(): void {
    this.buffer = ''
  }
}
