"use client"

import { useCallback, useRef, useState } from "react"
import { AudioQueue, PhraseSplitter } from "@/lib/streaming"

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
}

interface UseStreamingChatReturn {
  messages: StreamingMessage[]
  streamingContent: string
  isLoading: boolean
  isSpeaking: boolean
  sendMessage: (message: string, mood?: string, trend?: string) => Promise<void>
  clearMessages: () => void
}

export function useStreamingChat({
  conversationId,
  enableTTS = true,
  onSpeakingStart,
  onSpeakingEnd,
  isMuted = false,
}: UseStreamingChatOptions): UseStreamingChatReturn {
  const [messages, setMessages] = useState<StreamingMessage[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! I'm the $DEGEN otter! 🦦",
      timestamp: new Date(),
    },
  ])
  const [streamingContent, setStreamingContent] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Refs for managing streaming state
  const audioQueueRef = useRef<AudioQueue | null>(null)
  const phraseSplitterRef = useRef<PhraseSplitter>(new PhraseSplitter(15, 50)) // Small chunks for low latency
  const currentMoodRef = useRef<string>("neutral")
  const abortControllerRef = useRef<AbortController | null>(null)
  const ttsQueueRef = useRef<string[]>([])
  const isProcessingTTSRef = useRef(false)

  // Initialize audio queue
  const getAudioQueue = useCallback(() => {
    if (!audioQueueRef.current) {
      audioQueueRef.current = new AudioQueue(
        () => {
          setIsSpeaking(true)
          onSpeakingStart?.()
        },
        () => {
          setIsSpeaking(false)
          onSpeakingEnd?.()
        }
      )
    }
    return audioQueueRef.current
  }, [onSpeakingStart, onSpeakingEnd])

  // Process TTS queue - handles phrases one at a time
  const processTTSQueue = useCallback(async () => {
    if (isProcessingTTSRef.current || isMuted || !enableTTS) return
    
    const phrase = ttsQueueRef.current.shift()
    if (!phrase) return

    isProcessingTTSRef.current = true

    try {
      const response = await fetch("/api/tts/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: phrase,
          mood: currentMoodRef.current,
        }),
      })

      if (response.ok) {
        const audioBlob = await response.blob()
        const audioQueue = getAudioQueue()
        await audioQueue.enqueueBlob(audioBlob)
      }
    } catch (error) {
      console.error("TTS Error:", error)
    } finally {
      isProcessingTTSRef.current = false
      // Process next item in queue
      if (ttsQueueRef.current.length > 0) {
        processTTSQueue()
      }
    }
  }, [isMuted, enableTTS, getAudioQueue])

  // Queue phrase for TTS processing
  const queuePhraseForTTS = useCallback((phrase: string) => {
    if (isMuted || !enableTTS || !phrase.trim()) return
    
    ttsQueueRef.current.push(phrase)
    processTTSQueue()
  }, [isMuted, enableTTS, processTTSQueue])

  // Send message with streaming
  const sendMessage = useCallback(async (message: string, mood?: string, trend?: string) => {
    if (!message.trim() || isLoading) return

    // Cancel any ongoing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Store mood for TTS
    currentMoodRef.current = mood || "neutral"

    // Reset phrase splitter and TTS queue
    phraseSplitterRef.current.reset()
    ttsQueueRef.current = []
    isProcessingTTSRef.current = false

    // Clear audio queue
    audioQueueRef.current?.clear()

    // Add user message
    const userMessage: StreamingMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setStreamingContent("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message.trim(),
          conversationId,
          mood,
          trend,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error("No response body")
      }

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

              // Process for TTS - get speakable phrases (small chunks)
              if (enableTTS && !isMuted) {
                const phrases = phraseSplitterRef.current.addChunk(data.content)
                for (const phrase of phrases) {
                  queuePhraseForTTS(phrase)
                }
              }
            } else if (data.type === "done") {
              // Flush any remaining text for TTS
              if (enableTTS && !isMuted) {
                const remaining = phraseSplitterRef.current.flush()
                if (remaining) {
                  queuePhraseForTTS(remaining)
                }
              }

              // Add complete assistant message
              const assistantMessage: StreamingMessage = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.content || fullContent,
                timestamp: new Date(),
              }
              setMessages(prev => [...prev, assistantMessage])
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
      if (error.name === "AbortError") {
        console.log("Stream aborted")
        return
      }

      console.error("Streaming error:", error)
      
      // Add error message
      const errorMessage: StreamingMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! Something went wrong. Let me try again! 🦦",
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
      setStreamingContent("")
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId, enableTTS, isMuted, queuePhraseForTTS])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: "1",
        role: "assistant",
        content: "Hey! I'm the $DEGEN otter! 🦦",
        timestamp: new Date(),
      },
    ])
    setStreamingContent("")
    audioQueueRef.current?.clear()
    ttsQueueRef.current = []
  }, [])

  return {
    messages,
    streamingContent,
    isLoading,
    isSpeaking,
    sendMessage,
    clearMessages,
  }
}
