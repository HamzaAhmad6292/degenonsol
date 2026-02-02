"use client"

import { useCallback, useRef, useState } from "react"
import { AudioQueue } from "@/lib/streaming"
import { type LifecycleInfo } from "@/lib/lifecycle"

interface StreamingMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  isStreaming?: boolean
}

interface UseStreamingChatOptions {
  conversationId: string
  enableTTS?: boolean
  onSpeakingStart?: () => void
  onSpeakingEnd?: () => void
  isMuted?: boolean
  lifecycle?: LifecycleInfo
  /** When camera is on, called before each send to attach current frame to the LLM. Return base64 JPEG or null. */
  getCameraFrame?: () => Promise<string | null>
}

interface UseStreamingChatReturn {
  messages: StreamingMessage[]
  streamingContent: string
  isLoading: boolean
  isSpeaking: boolean
  sendMessage: (message: string, mood?: string, trend?: string) => Promise<void>
  clearMessages: () => void
}

/**
 * Eager Phrase Splitter - optimized for minimum latency TTS
 * Sends first chunk ASAP (after just 3-5 words), then normal chunks after
 */
class EagerPhraseSplitter {
  private buffer: string = ''
  private isFirstChunk: boolean = true
  private firstChunkMinWords: number = 3  // Send first chunk after just 3 words
  private normalMinLength: number = 15
  private maxLength: number = 50
  
  // Natural break points
  private breakPatterns = /([.!?,:;])(\s|$)|(\\s+[-–—]\\s+)|(\n)/

  reset() {
    this.buffer = ''
    this.isFirstChunk = true
  }

  /**
   * Add text and return speakable chunks
   * First chunk is sent ASAP for minimum latency
   */
  addChunk(text: string): string[] {
    this.buffer += text
    const chunks: string[] = []

    while (this.buffer.length > 0) {
      // FIRST CHUNK: Be very eager - send after just a few words
      if (this.isFirstChunk) {
        const words = this.buffer.trim().split(/\s+/)
        
        // Check for punctuation in the buffer first
        const punctMatch = this.buffer.match(/[.!?,;:]/)
        if (punctMatch && punctMatch.index !== undefined && punctMatch.index > 2) {
          const chunk = this.buffer.slice(0, punctMatch.index + 1).trim()
          if (chunk.length > 0) {
            chunks.push(chunk)
            this.buffer = this.buffer.slice(punctMatch.index + 1).trimStart()
            this.isFirstChunk = false
            continue
          }
        }
        
        // Or send after minimum words
        if (words.length >= this.firstChunkMinWords) {
          // Find a good break point (end of a word)
          const breakPoint = this.buffer.indexOf(' ', 8) // At least 8 chars
          if (breakPoint > 0) {
            const chunk = this.buffer.slice(0, breakPoint).trim()
            if (chunk.length > 0) {
              chunks.push(chunk)
              this.buffer = this.buffer.slice(breakPoint).trimStart()
              this.isFirstChunk = false
              continue
            }
          }
        }
        break // Wait for more content
      }
      
      // SUBSEQUENT CHUNKS: Normal splitting logic
      if (this.buffer.length >= this.normalMinLength) {
        // Look for natural break points
        const match = this.buffer.match(this.breakPatterns)
        
        if (match && match.index !== undefined && match.index >= 5) {
          const breakIndex = match.index + match[1]?.length || 1
          const chunk = this.buffer.slice(0, breakIndex).trim()
          if (chunk.length > 0) {
            chunks.push(chunk)
          }
          this.buffer = this.buffer.slice(breakIndex).trimStart()
          continue
        }
        
        // Force split if too long
        if (this.buffer.length > this.maxLength) {
          const spaceIndex = this.buffer.lastIndexOf(' ', this.maxLength)
          if (spaceIndex > 10) {
            const chunk = this.buffer.slice(0, spaceIndex).trim()
            if (chunk.length > 0) {
              chunks.push(chunk)
            }
            this.buffer = this.buffer.slice(spaceIndex + 1)
            continue
          }
        }
      }
      
      break // Not enough content yet
    }

    return chunks
  }

  flush(): string | null {
    const remaining = this.buffer.trim()
    this.buffer = ''
    this.isFirstChunk = true
    return remaining.length > 0 ? remaining : null
  }
}

/**
 * TTS Pipeline - Immediately starts fetching TTS as phrases arrive
 * Uses concurrent fetching to overlap network requests with audio playback
 */
class TTSPipeline {
  private audioQueue: AudioQueue
  private mood: string = "neutral"
  private lifecycleStage: string = "adult"
  private isMuted: boolean = false
  private enabled: boolean = true
  private pendingFetches: Set<Promise<void>> = new Set()
  private abortController: AbortController | null = null
  
  // Sequencing logic to prevent out-of-order playback
  private nextSequenceId: number = 0
  private expectedSequenceId: number = 0
  private completedBlobs: Map<number, Blob> = new Map()
  private isFlushingQueue: boolean = false

  constructor(audioQueue: AudioQueue) {
    this.audioQueue = audioQueue
  }

  configure(mood: string, muted: boolean, enabled: boolean, lifecycleStage: string = "adult") {
    this.mood = mood
    this.isMuted = muted
    this.enabled = enabled
    this.lifecycleStage = lifecycleStage
  }

  /**
   * Immediately start fetching TTS for a phrase
   * Does NOT wait - fires and forgets, audio queue handles playback order
   */
  queuePhrase(phrase: string) {
    if (this.isMuted || !this.enabled || !phrase.trim()) return
    
    const seqId = this.nextSequenceId++
    console.log(`[TTS Pipeline] Queueing (#${seqId}): "${phrase.slice(0, 30)}..."`)
    
    // Start fetch immediately - don't await!
    const fetchPromise = this.fetchAndQueue(phrase, seqId)
    this.pendingFetches.add(fetchPromise)
    fetchPromise.finally(() => this.pendingFetches.delete(fetchPromise))
  }

  private async fetchAndQueue(phrase: string, seqId: number): Promise<void> {
    const startTime = performance.now()
    try {
      const response = await fetch("/api/tts/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: phrase,
          mood: this.mood,
          lifecycleStage: this.lifecycleStage,
        }),
        signal: this.abortController?.signal,
      })

      if (response.ok && !this.isMuted) {
        const audioBlob = await response.blob()
        const fetchTime = performance.now() - startTime
        console.log(`[TTS Pipeline] Got audio for (#${seqId}): "${phrase.slice(0, 20)}..." (${fetchTime.toFixed(0)}ms)`)
        
        // Store blob and try to flush the queue in order
        this.completedBlobs.set(seqId, audioBlob)
        this.flushQueue()
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error(`TTS fetch error (#${seqId}):`, error)
      }
    }
  }

  /**
   * Enqueue all available blobs that are next in the sequence
   * Uses a lock to prevent concurrent execution
   */
  private flushQueue() {
    if (this.isFlushingQueue) return
    this.isFlushingQueue = true
    
    try {
      while (this.completedBlobs.has(this.expectedSequenceId)) {
        const blob = this.completedBlobs.get(this.expectedSequenceId)!
        console.log(`[TTS Pipeline] Flushing (#${this.expectedSequenceId}) to audio queue`)
        this.audioQueue.enqueueBlob(blob)
        this.completedBlobs.delete(this.expectedSequenceId)
        this.expectedSequenceId++
      }
    } finally {
      this.isFlushingQueue = false
    }
  }

  clear() {
    this.abortController?.abort()
    this.abortController = new AbortController()
    this.pendingFetches.clear()
    this.nextSequenceId = 0
    this.expectedSequenceId = 0
    this.completedBlobs.clear()
    this.isFlushingQueue = false
  }

  async waitForCompletion() {
    await Promise.all(Array.from(this.pendingFetches))
  }
}

export function useStreamingChat({
  conversationId,
  enableTTS = true,
  onSpeakingStart,
  onSpeakingEnd,
  isMuted = false,
  lifecycle,
  getCameraFrame,
}: UseStreamingChatOptions): UseStreamingChatReturn {
  const [messages, setMessages] = useState<StreamingMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! I am degen the otter 🦦 powered by OpenSouls And i have 8.6M followers on tiktok.",
      timestamp: new Date(),
    },
  ])
  const [streamingContent, setStreamingContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Refs
  const audioQueueRef = useRef<AudioQueue | null>(null)
  const ttsPipelineRef = useRef<TTSPipeline | null>(null)
  const phraseSplitterRef = useRef<EagerPhraseSplitter>(new EagerPhraseSplitter())
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize audio queue
  const getAudioQueue = useCallback(() => {
    if (!audioQueueRef.current) {
      audioQueueRef.current = new AudioQueue(
        () => {
          console.log("[Audio] Started playing")
          setIsSpeaking(true)
          onSpeakingStart?.()
        },
        () => {
          console.log("[Audio] Finished playing")
          setIsSpeaking(false)
          onSpeakingEnd?.()
        }
      )
    }
    return audioQueueRef.current
  }, [onSpeakingStart, onSpeakingEnd])

  // Initialize TTS pipeline
  const getTTSPipeline = useCallback(() => {
    if (!ttsPipelineRef.current) {
      ttsPipelineRef.current = new TTSPipeline(getAudioQueue())
    }
    return ttsPipelineRef.current
  }, [getAudioQueue])

  // Send message with true streaming TTS
  const sendMessage = useCallback(async (message: string, mood?: string, trend?: string) => {
    if (!message.trim() || isLoading) return

    // Cancel any ongoing stream
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    // Configure TTS pipeline
    const ttsPipeline = getTTSPipeline()
    ttsPipeline.clear()
    ttsPipeline.configure(mood || "neutral", isMuted, enableTTS, lifecycle?.stage)

    // Reset phrase splitter
    phraseSplitterRef.current.reset()

    // Clear audio queue
    getAudioQueue().clear()

    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    }])
    setStreamingContent("")
    setIsLoading(true)

    try {
      const cameraFrame = getCameraFrame ? await getCameraFrame() : null
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          conversationId,
          mood,
          trend,
          lifecycleStage: lifecycle?.stage,
          ...(cameraFrame ? { cameraFrame } : {}),
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) throw new Error("Failed to get response")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let fullContent = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n").filter(line => line.startsWith("data: "))

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6))

            if (data.type === "text" && data.content) {
              fullContent += data.content
              setStreamingContent(fullContent)

              // IMMEDIATELY process for TTS - this is the key!
              if (enableTTS && !isMuted) {
                const phrases = phraseSplitterRef.current.addChunk(data.content)
                // Queue each phrase immediately - no waiting!
                for (const phrase of phrases) {
                  ttsPipeline.queuePhrase(phrase)
                }
              }
            } else if (data.type === "done") {
              // Flush remaining text for TTS
              if (enableTTS && !isMuted) {
                const remaining = phraseSplitterRef.current.flush()
                if (remaining) {
                  ttsPipeline.queuePhrase(remaining)
                }
                
                // Wait for all TTS fetches to complete, then signal streaming is done
                ttsPipeline.waitForCompletion().then(() => {
                  console.log('[Streaming] All TTS fetches complete - calling finishStreaming()')
                  getAudioQueue().finishStreaming()
                })
              }

              // Add complete message
              setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.content || fullContent,
                timestamp: new Date(),
              }])
              setStreamingContent("")
            } else if (data.type === "error") {
              throw new Error(data.error)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") return

      console.error("Streaming error:", error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! Something went wrong. Let me try again! 🦦",
        timestamp: new Date(),
      }])
      setStreamingContent("")
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId, enableTTS, isMuted, getTTSPipeline, getAudioQueue, getCameraFrame, lifecycle?.stage])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([{
      id: "1",
      role: "assistant",
      content: "Hey! I'm the $DEGEN otter! 🦦",
      timestamp: new Date(),
    }])
    setStreamingContent("")
    getAudioQueue().clear()
    getTTSPipeline().clear()
  }, [getAudioQueue, getTTSPipeline])

  return {
    messages,
    streamingContent,
    isLoading,
    isSpeaking,
    sendMessage,
    clearMessages,
  }
}
