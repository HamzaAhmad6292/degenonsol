// Audio queue for sequential playback of TTS chunks
// Supports both full audio blobs and streaming audio

export class AudioQueue {
  private queue: Blob[] = []
  private isPlaying: boolean = false
  private currentAudio: HTMLAudioElement | null = null
  private onPlayingStart?: () => void
  private onPlayingEnd?: () => void
  private hasStartedPlaying: boolean = false
  private isStreamingComplete: boolean = false

  constructor(
    onPlayingStart?: () => void,
    onPlayingEnd?: () => void
  ) {
    this.onPlayingStart = onPlayingStart
    this.onPlayingEnd = onPlayingEnd
  }

  /**
   * Add audio blob to the queue and start playing if not already
   */
  async enqueueBlob(blob: Blob): Promise<void> {
    console.log(`[AudioQueue] Enqueuing blob (${blob.size} bytes). Queue length: ${this.queue.length}, isPlaying: ${this.isPlaying}`)
    this.queue.push(blob)
    this.playNext()
  }

  /**
   * Add audio chunk to the queue (base64 encoded)
   */
  enqueue(audioBase64: string): void {
    const binaryString = atob(audioBase64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const blob = new Blob([bytes], { type: 'audio/mpeg' })
    this.queue.push(blob)
    this.playNext()
  }

  /**
   * Play the next audio chunk in the queue
   */
  private async playNext(): Promise<void> {
    if (this.isPlaying || this.queue.length === 0) {
      // If queue is empty and streaming is complete, end playback
      if (this.queue.length === 0 && this.isStreamingComplete && this.hasStartedPlaying) {
        console.log('[AudioQueue] Queue empty and streaming complete - calling onPlayingEnd')
        this.hasStartedPlaying = false
        this.isStreamingComplete = false
        this.onPlayingEnd?.()
      }
      return
    }

    this.isPlaying = true
    const blob = this.queue.shift()!
    console.log(`[AudioQueue] Playing audio chunk (${blob.size} bytes). Remaining in queue: ${this.queue.length}`)

    try {
      const url = URL.createObjectURL(blob)
      this.currentAudio = new Audio(url)
      
      // Notify playing started (only on first chunk of a new batch)
      if (!this.hasStartedPlaying) {
        this.hasStartedPlaying = true
        console.log('[AudioQueue] Starting playback - calling onPlayingStart')
        this.onPlayingStart?.()
      }

      this.currentAudio.onended = () => {
        console.log(`[AudioQueue] Audio chunk ended. Queue length: ${this.queue.length}, streamingComplete: ${this.isStreamingComplete}`)
        URL.revokeObjectURL(url)
        this.isPlaying = false
        this.currentAudio = null
        
        // Always try to play next chunk
        this.playNext()
      }

      this.currentAudio.onerror = (e) => {
        console.error('Audio playback error:', e)
        URL.revokeObjectURL(url)
        this.isPlaying = false
        this.currentAudio = null
        this.playNext() // Try next chunk
      }

      await this.currentAudio.play()
      console.log('[AudioQueue] Audio.play() called successfully')
    } catch (error) {
      console.error('Audio playback error:', error)
      this.isPlaying = false
      this.currentAudio = null
      this.playNext() // Try next chunk
    }
  }

  /**
   * Signal that all audio chunks have been queued (streaming complete)
   */
  finishStreaming(): void {
    console.log('[AudioQueue] Streaming finished - marking as complete')
    this.isStreamingComplete = true
    // Trigger playNext to check if we should end
    this.playNext()
  }

  /**
   * Stop playback and clear the queue
   */
  clear(): void {
    this.queue = []
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }
    this.isPlaying = false
    this.hasStartedPlaying = false
    this.isStreamingComplete = false
  }

  /**
   * Check if audio is currently playing or queued
   */
  get hasAudio(): boolean {
    return this.isPlaying || this.queue.length > 0
  }

  /**
   * Get queue length
   */
  get queueLength(): number {
    return this.queue.length
  }
}

/**
 * Streaming audio player that can play audio as chunks arrive
 * Uses MediaSource API for true streaming playback
 */
export class StreamingAudioPlayer {
  private mediaSource: MediaSource | null = null
  private sourceBuffer: SourceBuffer | null = null
  private audioElement: HTMLAudioElement | null = null
  private pendingChunks: ArrayBuffer[] = []
  private isReady: boolean = false
  private onPlayingStart?: () => void
  private onPlayingEnd?: () => void

  constructor(
    onPlayingStart?: () => void,
    onPlayingEnd?: () => void
  ) {
    this.onPlayingStart = onPlayingStart
    this.onPlayingEnd = onPlayingEnd
  }

  /**
   * Initialize the streaming player
   */
  async init(): Promise<void> {
    if (typeof window === 'undefined' || !window.MediaSource) {
      console.warn('MediaSource API not supported')
      return
    }

    this.mediaSource = new MediaSource()
    this.audioElement = new Audio()
    this.audioElement.src = URL.createObjectURL(this.mediaSource)

    return new Promise((resolve) => {
      this.mediaSource!.addEventListener('sourceopen', () => {
        try {
          this.sourceBuffer = this.mediaSource!.addSourceBuffer('audio/mpeg')
          this.sourceBuffer.mode = 'sequence'
          
          this.sourceBuffer.addEventListener('updateend', () => {
            this.processPendingChunks()
          })

          this.isReady = true
          resolve()
        } catch (e) {
          console.error('Failed to create source buffer:', e)
          resolve()
        }
      })
    })
  }

  /**
   * Add an audio chunk to be played
   */
  async addChunk(chunk: ArrayBuffer): Promise<void> {
    if (!this.isReady || !this.sourceBuffer) {
      this.pendingChunks.push(chunk)
      return
    }

    if (this.sourceBuffer.updating) {
      this.pendingChunks.push(chunk)
      return
    }

    try {
      this.sourceBuffer.appendBuffer(chunk)
      
      // Start playing if not already
      if (this.audioElement && this.audioElement.paused) {
        await this.audioElement.play()
        this.onPlayingStart?.()
      }
    } catch (e) {
      console.error('Failed to append buffer:', e)
    }
  }

  /**
   * Process any pending chunks
   */
  private processPendingChunks(): void {
    if (this.pendingChunks.length > 0 && this.sourceBuffer && !this.sourceBuffer.updating) {
      const chunk = this.pendingChunks.shift()!
      try {
        this.sourceBuffer.appendBuffer(chunk)
      } catch (e) {
        console.error('Failed to append pending buffer:', e)
      }
    }
  }

  /**
   * Signal that no more chunks will be added
   */
  end(): void {
    if (this.mediaSource && this.mediaSource.readyState === 'open') {
      try {
        this.mediaSource.endOfStream()
      } catch (e) {
        console.error('Failed to end stream:', e)
      }
    }

    if (this.audioElement) {
      this.audioElement.onended = () => {
        this.onPlayingEnd?.()
        this.cleanup()
      }
    }
  }

  /**
   * Stop and cleanup
   */
  cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      URL.revokeObjectURL(this.audioElement.src)
      this.audioElement = null
    }
    this.mediaSource = null
    this.sourceBuffer = null
    this.pendingChunks = []
    this.isReady = false
  }
}
