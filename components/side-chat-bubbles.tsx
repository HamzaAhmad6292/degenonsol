"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Eye, EyeOff, Mic, Square, Volume2, VolumeX, Video, VideoOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Sentiment } from "@/lib/sentiment-analyzer"
import { useStreamingChat } from "@/hooks/use-streaming-chat"
import { type GifState } from "@/app/chat/page"
import { type LifecycleInfo } from "@/lib/lifecycle"

interface SideChatBubblesProps {
  onSentimentChange?: (sentiment: Sentiment | null) => void
  onSpeakingChange?: (isSpeaking: boolean) => void
  currentMood: GifState
  currentTrend: "up" | "down" | "neutral"
  currentSentiment?: Sentiment | null
  onHideChat?: () => void
  lifecycle: LifecycleInfo
  cameraOpen?: boolean
  onCameraToggle?: () => void
}

// Add type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function SideChatBubbles({ 
  onSentimentChange, 
  onSpeakingChange, 
  currentMood, 
  currentTrend, 
  currentSentiment,
  onHideChat,
  lifecycle,
  cameraOpen = false,
  onCameraToggle,
}: SideChatBubblesProps) {
  const [input, setInput] = useState("")
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef<string>(`conv-${Date.now()}`)
  const recognitionRef = useRef<any>(null)
  const inputValueRef = useRef("")
  /** Transcript for current recording session, updated synchronously so we can send on stop without waiting for React state */
  const transcriptRef = useRef("")
  const handleSendRef = useRef<(text?: string) => Promise<void>>(async () => {})

  // Use the streaming chat hook
  const {
    messages,
    streamingContent,
    isLoading,
    isSpeaking,
    sendMessage,
  } = useStreamingChat({
    conversationId: conversationIdRef.current,
    enableTTS: true,
    onSpeakingStart: () => onSpeakingChange?.(true),
    onSpeakingEnd: () => onSpeakingChange?.(false),
    isMuted,
  })

  // Scroll to bottom when messages or streaming content changes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Sync ref with state for voice recording
  useEffect(() => {
    inputValueRef.current = input
  }, [input])

  // Notify parent about speaking changes
  useEffect(() => {
    onSpeakingChange?.(isSpeaking)
  }, [isSpeaking, onSpeakingChange])

  // Handle sending message with sentiment analysis
  const handleSend = useCallback(async (textOverride?: string) => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || isLoading) return
    
    // Ensure chat is visible when sending
    if (!isChatVisible) setIsChatVisible(true)

    // Analyze sentiment of user message
    let freshSentiment: Sentiment = "neutral"
    try {
      const sentimentResponse = await fetch("/api/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSend.trim() }),
      })
      
      if (sentimentResponse.ok) {
        const { sentiment } = await sentimentResponse.json()
        freshSentiment = sentiment
        onSentimentChange?.(sentiment)
      }
    } catch (error) {
      console.error("Sentiment analysis failed:", error)
    }

    // Determine TTS mood based on:
    // 1. User's message sentiment (highest priority)
    // 2. Price trend (up/down)
    // 3. Current GIF mood state
    let moodToSend: string
    
    if (freshSentiment === "negative") {
      // User said something negative → otter gets angry
      moodToSend = "angry"
    } else if (freshSentiment === "positive") {
      // User said something positive → otter is happy
      moodToSend = "happy"
    } else if (currentTrend === "down") {
      // Price is down → otter is frustrated/annoyed (NOT sad)
      moodToSend = "frustrated"
    } else if (currentTrend === "up") {
      // Price is up → otter is excited
      moodToSend = "excited"
    } else {
      // Neutral trend → map GIF state to TTS mood
      switch (currentMood) {
        case "happy":
          moodToSend = "happy"
          break
        case "sad":
        case "sad_idle":
        case "sad_idle_2":
        case "sad_idle_3":
          // Even when GIF shows sad, voice should be frustrated/annoyed
          moodToSend = "frustrated"
          break
        case "happy_idle_2":
        case "happy_idle_3":
          // Higher intensity happy states
          moodToSend = "excited"
          break
        case "idle":
        default:
          moodToSend = "neutral"
          break
      }
    }

    console.log(`[Chat] Sentiment: ${freshSentiment}, Trend: ${currentTrend}, GIF: ${currentMood} → TTS Mood: ${moodToSend}`)

    // Clear input and send
    setInput("")
    
    // Use streaming chat
    await sendMessage(textToSend.trim(), moodToSend, currentTrend)
  }, [input, isLoading, isChatVisible, currentMood, currentTrend, onSentimentChange, sendMessage])

  // Keep ref in sync for use inside recognition callbacks (must be after handleSend is defined)
  useEffect(() => {
    handleSendRef.current = handleSend
  }, [handleSend])

  // Voice recording toggle — when you stop recording, the message auto-sends (no need to tap Send)
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      // Send is handled in onend so we use the full transcript (state may not have updated yet)
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.")
        return
      }

      transcriptRef.current = ""

      const recognition = new SpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        setIsRecording(true)
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ''
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript
          }
        }
        if (finalTranscript) {
          transcriptRef.current += (transcriptRef.current ? " " : "") + finalTranscript
          setInput((prev) => prev + (prev ? " " : "") + finalTranscript)
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error)
        setIsRecording(false)
      }

      recognition.onend = () => {
        if (isRecording) {
          setIsRecording(false)
        }
        // Auto-send when recording ends so user doesn't have to tap Send
        const text = transcriptRef.current.trim()
        if (text) handleSendRef.current?.(text)
        transcriptRef.current = ""
      }

      recognition.start()
      recognitionRef.current = recognition
    }
  }, [isRecording])

  return (
    <>
      <AnimatePresence>
        {isChatVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className="fixed inset-x-0 top-20 bottom-44 z-30 overflow-y-auto pointer-events-auto scrollbar-luxury"
          >
            <div className="w-full max-w-2xl mx-auto min-h-full flex flex-col px-3 sm:px-4 pb-4">
              <div className="flex-1 min-h-[1rem]" />
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant"
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`rounded-2xl px-4 py-3 max-w-[88%] sm:max-w-[80%] ${
                            isAssistant
                              ? "rounded-tl-md bg-white/[0.08] border border-white/[0.12]"
                              : "rounded-tr-md bg-[#D4AF37]/15 border border-[#D4AF37]/25"
                          }`}
                        >
                          <p className="text-[15px] leading-[1.5] text-white/95 whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {/* Streaming message */}
                {streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-tl-md px-4 py-3 max-w-[88%] sm:max-w-[80%] bg-white/[0.08] border border-white/[0.12]">
                      <p className="text-[15px] leading-[1.5] text-white/95 whitespace-pre-wrap">
                        {streamingContent}
                        <span className="inline-block w-0.5 h-4 bg-[#D4AF37] ml-0.5 rounded-full animate-pulse align-middle" />
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Loading (waiting for first chunk) */}
                {isLoading && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl rounded-tl-md px-4 py-3 bg-white/[0.08] border border-white/[0.12]">
                      <div className="flex items-center gap-2.5">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <span className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" />
                        </div>
                        <span className="text-white/50 text-[13px]">Thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Lifecycle message (born / dead) */}
                {!lifecycle.canInteract && lifecycle.systemMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center py-4"
                  >
                    <div className="rounded-2xl px-4 py-3 max-w-[90%] text-center bg-white/[0.06] border border-white/10">
                      <p className="text-white/90 text-sm font-medium">
                        {lifecycle.systemMessage}
                      </p>
                      <p className="text-white/40 text-xs mt-1">
                        {lifecycle.stage === "born" ? "Initialization in progress..." : "Resting in peace."}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input — text bar has only input + send; other actions in a row above */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-3 sm:px-4 pt-3 pb-4 sm:pb-5 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.85)_20%)]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto flex flex-col gap-2"
        >
          {/* Row above: hide chat, mute, camera, mic — keeps text bar clean */}
          <div className="flex items-center justify-center gap-1">
            <Button
              onClick={() => {
                if (isChatVisible && onHideChat) onHideChat()
                setIsChatVisible(!isChatVisible)
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
              aria-label={isChatVisible ? "Hide chat" : "Show chat"}
            >
              {isChatVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-40"
              disabled={!lifecycle.canInteract}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </Button>
            {onCameraToggle && (
              <Button
                onClick={onCameraToggle}
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-white/50 hover:text-white hover:bg-white/10"
                aria-label={cameraOpen ? "Hide camera" : "Show camera"}
              >
                {cameraOpen ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
              </Button>
            )}
            <Button
              onClick={toggleRecording}
              type="button"
              disabled={!lifecycle.canInteract}
              className={`h-8 w-8 rounded-lg shrink-0 ${
                isRecording
                  ? "bg-red-500/25 text-red-400 hover:bg-red-500/35"
                  : "text-white/50 hover:text-white hover:bg-white/10"
              }`}
              aria-label={isRecording ? "Stop recording" : "Voice input"}
            >
              {isRecording ? <Square className="w-3.5 h-3.5 fill-current" /> : <Mic className="w-3.5 h-3.5" />}
            </Button>
          </div>

          {/* Text bar: only input + send */}
          <div className="flex items-stretch gap-2">
            <div className="flex-1 min-w-0 flex items-center rounded-2xl bg-white/[0.08] border border-white/[0.14] pl-4 pr-2 py-1.5 focus-within:border-white/25 focus-within:bg-white/[0.1] transition-colors">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={
                  !lifecycle.canInteract
                    ? "Interaction disabled"
                    : isRecording
                      ? "Listening…"
                      : "Message Degen…"
                }
                className="flex-1 min-w-0 bg-transparent border-0 py-2 text-[15px] text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
                disabled={isLoading || !lifecycle.canInteract}
                aria-label="Message input"
              />
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading || !lifecycle.canInteract}
              className="h-12 w-12 shrink-0 rounded-2xl bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90 disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Send"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>

        <p className="text-center text-[10px] text-white/25 mt-2 pb-1">
          powered by <span className="text-white/40">opensouls</span>
        </p>
      </div>
    </>
  )
}
