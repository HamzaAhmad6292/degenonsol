"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Eye, EyeOff, Mic, Square, Volume2, VolumeX, Video, VideoOff, ScanEye, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type Sentiment } from "@/lib/sentiment-analyzer"
import { useStreamingChat } from "@/hooks/use-streaming-chat"
import { type GifState } from "@/app/chat/page"
import { type LifecycleInfo } from "@/lib/lifecycle"

/** Format timestamp for message metadata (e.g. "2:34 PM") */
function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })
}

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
  /** Opens AR overlay; when provided, AR button is shown in input area with clear label/tooltip */
  onArOpen?: () => void
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
  onArOpen,
}: SideChatBubblesProps) {
  const [input, setInput] = useState("")
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const [arPulseDone, setArPulseDone] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef<string>(`conv-${Date.now()}`)
  const recognitionRef = useRef<any>(null)
  const inputValueRef = useRef("")
  const transcriptRef = useRef("")
  const handleSendRef = useRef<(text?: string) => Promise<void>>(() => Promise.resolve())
  /** IDs present at first paint — only these get staggered entrance; new messages get single entrance */
  const initialBatchIdsRef = useRef<Set<string>>(new Set())
  const staggerInitializedRef = useRef(false)

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

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, streamingContent, scrollToBottom])

  // Stagger only for messages present on first load
  if (messages.length > 0 && !staggerInitializedRef.current) {
    staggerInitializedRef.current = true
    initialBatchIdsRef.current = new Set(messages.map((m) => m.id))
  }

  // Scroll position: show "jump to latest" when user has scrolled up (with threshold)
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const threshold = 80
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight
      setShowScrollToBottom(distanceFromBottom > threshold)
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener("scroll", onScroll)
  }, [messages.length, streamingContent])

  // AR button: subtle pulse 1–2 cycles on first render, then stop
  useEffect(() => {
    if (!onArOpen || arPulseDone) return
    const t = setTimeout(() => setArPulseDone(true), 2000)
    return () => clearTimeout(t)
  }, [onArOpen, arPulseDone])

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

  const isInInitialBatch = useCallback((id: string) => initialBatchIdsRef.current.has(id), [])

  return (
    <>
      <AnimatePresence>
        {isChatVisible && (
          <motion.div
            ref={scrollContainerRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
            className="fixed inset-x-0 top-20 bottom-52 z-30 overflow-y-auto scrollbar-luxury pointer-events-auto"
            style={{
              fontFamily: "var(--font-chat), var(--font-sans), sans-serif",
              background: "transparent",
            }}
          >
            <div className="w-full max-w-2xl mx-auto min-h-full flex flex-col px-4">
              <div className="flex-1" />
              <div className="space-y-4 pb-2" style={{ gap: "var(--chat-space-message)" }}>
                <AnimatePresence mode="popLayout">
                  {messages.map((message, index) => {
                    const isAssistant = message.role === "assistant"
                    const staggerDelay = isInInitialBatch(message.id) ? index * 0.04 : 0
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{
                          duration: 0.25,
                          ease: [0.16, 1, 0.3, 1],
                          delay: staggerDelay,
                        }}
                        className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`rounded-xl p-2 md:p-2.5 max-w-[92%] md:max-w-[82%] min-w-0 ${
                            isAssistant ? "rounded-bl-none" : "rounded-br-none"
                          }`}
                          style={{
                            background: isAssistant ? "var(--chat-glass-bg-received)" : "var(--chat-glass-bg-sent)",
                            backdropFilter: "var(--chat-glass-backdrop)",
                            WebkitBackdropFilter: "var(--chat-glass-backdrop)",
                            border: isAssistant ? "var(--chat-glass-border)" : "var(--chat-glass-border-sent)",
                            boxShadow: isAssistant ? "var(--chat-glass-shadow)" : "var(--chat-glass-shadow-sent)",
                            borderRadius: "var(--chat-radius-lg)",
                            overflow: "hidden",
                          }}
                        >
                          <p style={{ color: "var(--chat-text-muted)", fontSize: "0.6rem", fontWeight: 600, marginBottom: "0.125rem", letterSpacing: "0.02em" }}>
                            {isAssistant ? "Otter" : "You"}
                          </p>
                          <p style={{ color: "var(--chat-text)", lineHeight: 1.45, whiteSpace: "pre-wrap", fontWeight: 500, fontSize: "0.75rem", overflowWrap: "break-word", wordBreak: "break-word" }}>
                            {message.content}
                          </p>
                          <p style={{ color: "var(--chat-text-muted)", fontSize: "0.5625rem", marginTop: "0.25rem" }}>
                            {formatMessageTime(message.timestamp)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-xl rounded-bl-none p-2 md:p-2.5 max-w-[92%] md:max-w-[82%] min-w-0 overflow-hidden"
                      style={{
                        background: "var(--chat-glass-bg-received)",
                        backdropFilter: "var(--chat-glass-backdrop)",
                        WebkitBackdropFilter: "var(--chat-glass-backdrop)",
                        border: "var(--chat-glass-border)",
                        boxShadow: "var(--chat-glass-shadow)",
                        borderRadius: "var(--chat-radius-lg)",
                      }}
                    >
                      <p style={{ color: "var(--chat-text-muted)", fontSize: "0.6rem", fontWeight: 600, marginBottom: "0.125rem" }}>Otter</p>
                      <p style={{ color: "var(--chat-text)", lineHeight: 1.45, whiteSpace: "pre-wrap", fontWeight: 500, fontSize: "0.75rem", overflowWrap: "break-word", wordBreak: "break-word" }}>
                        {streamingContent}
                        <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" style={{ borderRadius: 2 }} />
                      </p>
                    </div>
                  </motion.div>
                )}

                {isLoading && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-xl rounded-bl-none p-2.5 md:p-3"
                      style={{
                        background: "var(--chat-glass-bg-received)",
                        backdropFilter: "var(--chat-glass-backdrop)",
                        WebkitBackdropFilter: "var(--chat-glass-backdrop)",
                        border: "var(--chat-glass-border)",
                        boxShadow: "var(--chat-glass-shadow)",
                        borderRadius: "var(--chat-radius-lg)",
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: "var(--chat-accent)" }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: "var(--chat-accent)" }} />
                          <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--chat-accent)" }} />
                        </div>
                        <span style={{ color: "var(--chat-text-muted)", fontSize: "0.75rem", fontWeight: 500 }}>Otter is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {!lifecycle.canInteract && lifecycle.systemMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center my-8"
                  >
                    <div
                      className="rounded-xl p-3 md:p-4 max-w-[85%] text-center"
                      style={{
                        background: "rgba(239, 68, 68, 0.12)",
                        backdropFilter: "var(--chat-glass-backdrop)",
                        WebkitBackdropFilter: "var(--chat-glass-backdrop)",
                        border: "1px solid rgba(239, 68, 68, 0.28)",
                        boxShadow: "0 8px 32px rgba(239, 68, 68, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                        borderRadius: "var(--chat-radius-lg)",
                      }}
                    >
                      <p style={{ color: "var(--chat-text)", fontWeight: 700, fontSize: "0.875rem", marginBottom: "0.125rem" }}>
                        {lifecycle.systemMessage}
                      </p>
                      <p style={{ color: "var(--chat-text-muted)", fontSize: "0.75rem" }}>
                        {lifecycle.stage === "born" ? "Initialization in progress..." : "Resting in peace."}
                      </p>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Jump to latest — visible when scrolled up */}
            <AnimatePresence>
              {showScrollToBottom && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.2 }}
                  onClick={scrollToBottom}
                  className="fixed bottom-56 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium border shadow-lg"
                  style={{
                    background: "var(--chat-surface)",
                    color: "var(--chat-text-secondary)",
                    borderColor: "var(--chat-border)",
                    boxShadow: "var(--chat-shadow-surface)",
                    transition: "transform var(--motion-micro) var(--ease-out), opacity var(--motion-micro) var(--ease-out)",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "translate(-50%, 2px) scale(0.97)"
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "translate(-50%, 0) scale(1)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translate(-50%, 0) scale(1)"
                  }}
                >
                  <ChevronDown className="w-4 h-4" />
                  Latest
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Section — elevated surface, design tokens, transitions on base */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-3 md:px-4 pb-4 md:pb-6 pt-6 flex flex-col gap-3 md:gap-4"
        style={{
          background: "linear-gradient(180deg, transparent 0%, var(--chat-bg-gradient-to) 24%, var(--chat-page-bg) 100%)",
          fontFamily: "var(--font-chat), var(--font-sans), sans-serif",
        }}
      >
        {/* Mic + AR + Camera row — AR contextual next to camera */}
        <div className="flex justify-center items-center gap-3 md:gap-4">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            disabled={!lifecycle.canInteract}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0 border backdrop-blur-md transition-[transform,opacity,background-color] duration-[var(--motion-micro)] ease-[var(--ease-out)] hover:scale-105 active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "var(--chat-surface-received)",
              color: "var(--chat-text)",
              borderColor: "var(--chat-border)",
            }}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>

          <Button
            onClick={toggleRecording}
            type="button"
            disabled={!lifecycle.canInteract}
            className={`w-12 h-12 md:w-16 md:h-16 rounded-full border shrink-0 transition-[transform,opacity,background-color] duration-[var(--motion-micro)] ease-[var(--ease-out)] active:scale-[0.97] shadow-lg ${
              isRecording
                ? "bg-red-500/20 text-red-400 border-red-500/50 animate-pulse"
                : !lifecycle.canInteract
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "hover:scale-105"
            }`}
            style={
              !isRecording && lifecycle.canInteract
                ? { background: "var(--chat-surface-received)", color: "var(--chat-text)", borderColor: "var(--chat-border)" }
                : undefined
            }
          >
            {isRecording ? <Square className="w-4 h-4 md:w-6 md:h-6 fill-current" /> : <Mic className="w-5 h-5 md:w-8 md:h-8" />}
          </Button>

          {onArOpen != null && (
            <div className="relative group">
              <button
                type="button"
                onClick={onArOpen}
                aria-label="Start AR Mode"
                className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 border backdrop-blur-md transition-[transform,opacity,background-color] duration-[var(--motion-micro)] ease-[var(--ease-out)] hover:scale-105 active:scale-[0.97] ${!arPulseDone ? "chat-ar-pulse" : ""}`}
                style={{
                  background: "var(--chat-accent)",
                  color: "var(--primary-foreground)",
                  borderColor: "rgba(212, 175, 55, 0.4)",
                }}
              >
                <ScanEye className="w-3.5 h-3.5 md:w-4 md:h-4" aria-hidden />
              </button>
              <span
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--motion-micro)] pointer-events-none z-50"
                style={{ background: "var(--chat-surface)", color: "var(--chat-text-secondary)", border: "1px solid var(--chat-border)", boxShadow: "var(--chat-shadow-surface)" }}
              >
                Start AR Mode
              </span>
            </div>
          )}

          <Button
            onClick={onCameraToggle}
            type="button"
            title={cameraOpen ? "Hide camera" : "Show my camera"}
            disabled={!onCameraToggle}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full shrink-0 border backdrop-blur-md transition-[transform,opacity,background-color] duration-[var(--motion-micro)] ease-[var(--ease-out)] hover:scale-105 active:scale-[0.97] disabled:opacity-50"
            style={{
              background: "var(--chat-surface-received)",
              color: "var(--chat-text)",
              borderColor: "var(--chat-border)",
            }}
          >
            {cameraOpen ? <VideoOff className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Video className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>
        </div>

        {/* Input row — elevated field, focus ring transition */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.65, 0, 0.35, 1] }}
          className="max-w-md mx-auto flex items-center gap-2 w-full"
        >
          <Button
            onClick={() => {
              if (isChatVisible && onHideChat) onHideChat()
              setIsChatVisible(!isChatVisible)
            }}
            className="rounded-xl md:rounded-2xl w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center border backdrop-blur-md transition-[transform,opacity,background-color] duration-[var(--motion-micro)] ease-[var(--ease-out)] hover:scale-105 active:scale-[0.97]"
            style={{
              background: "var(--chat-surface-received)",
              color: "var(--chat-text)",
              borderColor: "var(--chat-border)",
            }}
          >
            {isChatVisible ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>
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
            placeholder={!lifecycle.canInteract ? "Interaction disabled" : isRecording ? "Listening..." : "Type a message..."}
            disabled={isLoading || !lifecycle.canInteract}
            className="flex-1 min-w-0 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-sm backdrop-blur-md focus:outline-none disabled:opacity-50 transition-[box-shadow,border-color] duration-[var(--motion-interaction)] ease-[var(--ease-in-out)] placeholder:opacity-70"
            style={{
              background: "var(--chat-surface-received)",
              color: "var(--chat-text)",
              border: "1px solid var(--chat-border)",
              boxShadow: "var(--chat-shadow-input)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = "var(--chat-shadow-input), 0 0 0 2px var(--chat-accent)"
              e.currentTarget.style.borderColor = "var(--chat-accent)"
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = "var(--chat-shadow-input)"
              e.currentTarget.style.borderColor = "var(--chat-border)"
            }}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || !lifecycle.canInteract}
            className="rounded-xl md:rounded-2xl w-10 h-10 md:w-12 md:h-12 shrink-0 flex items-center justify-center border-0 transition-[transform,opacity] duration-[var(--motion-micro)] ease-[var(--ease-out)] hover:scale-105 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--chat-accent)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--chat-shadow-input), 0 0 0 0 rgba(212, 175, 55, 0.2)",
            }}
          >
            {isLoading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : <Send className="w-4 h-4 md:w-5 md:h-5" />}
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pb-safe"
        >
          <p className="text-[9px] md:text-[10px] font-medium tracking-tight" style={{ color: "var(--chat-text-muted)" }}>
            powered by <span className="font-bold" style={{ color: "var(--chat-text-secondary)" }}>opensouls</span>
          </p>
        </motion.div>
      </div>
    </>
  )
}
