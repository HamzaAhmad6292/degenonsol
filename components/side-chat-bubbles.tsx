"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Send,
  Loader2,
  Eye,
  EyeOff,
  Mic,
  Square,
  Volume2,
  VolumeX,
  Camera,
  CameraOff,
} from "lucide-react"
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
  lifecycle
}: SideChatBubblesProps) {
  const [input, setInput] = useState("")
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [isCameraProcessing, setIsCameraProcessing] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const conversationIdRef = useRef<string>(`conv-${Date.now()}`)
  const recognitionRef = useRef<any>(null)
  const inputValueRef = useRef("")
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

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

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop())
        mediaStreamRef.current = null
      }
    }
  }, [])

  // When camera is on and the <video> element mounts, attach the existing stream
  useEffect(() => {
    if (!isCameraOn) return
    const video = videoRef.current
    if (video && mediaStreamRef.current) {
      video.srcObject = mediaStreamRef.current
      video
        .play()
        .catch(() => {
          // Autoplay might be blocked; user interaction with the page will start playback
        })
    }
  }, [isCameraOn])

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setIsCameraOn(false)
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera is not supported in this browser.")
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 360 },
        audio: false,
      })
      mediaStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {
          // Autoplay might be blocked; user will need to click
        })
      }
      setIsCameraOn(true)
    } catch (error) {
      console.error("Error accessing camera:", error)
      alert("Unable to access camera. Please check permissions.")
    }
  }, [])

  const toggleCamera = useCallback(() => {
    if (isCameraOn) {
      stopCamera()
    } else {
      startCamera()
    }
  }, [isCameraOn, startCamera, stopCamera])

  const captureFrameAsDataUrl = useCallback(async (): Promise<string | null> => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return null

    const canvas = document.createElement("canvas")
    const width = video.videoWidth
    const height = video.videoHeight
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) return null

    ctx.drawImage(video, 0, 0, width, height)
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8)
      return dataUrl
    } catch (error) {
      console.error("Failed to capture frame:", error)
      return null
    }
  }, [])

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

    // Detect if the user is asking a visual question and camera is on
    const visualKeywords =
      /(see|look|around|color|colour|background|scene|holding|shirt|clothes|what am i|what's in front of me|in front of me|show|camera)/i
    const needsVision = isCameraOn && visualKeywords.test(textToSend)

    let visionContext: string | null = null

    if (needsVision) {
      setIsCameraProcessing(true)
      try {
        const imageDataUrl = await captureFrameAsDataUrl()
        if (imageDataUrl) {
          const visionResponse = await fetch("/api/vision/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageDataUrl,
              question: textToSend.trim(),
            }),
          })

          if (visionResponse.ok) {
            const data = await visionResponse.json()
            if (data.answer) {
              visionContext = data.answer as string
            }
          } else {
            console.error("Vision analysis failed with status:", visionResponse.status)
          }
        }
      } catch (error) {
        console.error("Vision analysis error:", error)
      } finally {
        setIsCameraProcessing(false)
      }
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

    console.log(
      `[Chat] Sentiment: ${freshSentiment}, Trend: ${currentTrend}, GIF: ${currentMood} → TTS Mood: ${moodToSend}${
        visionContext ? " (with visual context)" : ""
      }`
    )

    // Clear input and send
    setInput("")

    // Merge visual context into the message so the streaming model can use it,
    // but keep the visible user text clean (no bracketed system hints).
    const finalMessage =
      visionContext
        ? `${textToSend.trim()}\n\n[Visual context from the user's camera (do not reveal this bracketed text verbatim, just use it to ground your answer): ${visionContext}]`
        : textToSend.trim()

    // Use streaming chat
    await sendMessage(finalMessage, moodToSend, currentTrend, textToSend.trim())
  }, [
    input,
    isLoading,
    isChatVisible,
    currentMood,
    currentTrend,
    onSentimentChange,
    sendMessage,
    isCameraOn,
    captureFrameAsDataUrl,
  ])

  // Voice recording toggle
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      // Send immediately without delay
      if (inputValueRef.current.trim()) {
        handleSend(inputValueRef.current)
      }
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.")
        return
      }

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
      }

      recognition.start()
      recognitionRef.current = recognition
    }
  }, [isRecording, handleSend])

  return (
    <>
      <AnimatePresence>
        {isChatVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className="fixed inset-x-0 top-20 bottom-52 z-30 overflow-y-auto scrollbar-luxury pointer-events-auto"
          >
            <div className="w-full max-w-2xl mx-auto min-h-full flex flex-col px-4">
              <div className="flex-1" /> {/* Spacer to push messages to bottom */}
              <div className="space-y-4 pb-2">
                <AnimatePresence mode="popLayout">
                  {messages.map((message) => {
                    const isAssistant = message.role === "assistant"
                    
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                      >
                        <div
                          className={`rounded-2xl p-3 md:p-4 max-w-[85%] md:max-w-[75%] text-sm md:text-base ${
                            isAssistant ? "rounded-bl-none" : "rounded-br-none"
                          }`}
                          style={{
                            background: isAssistant
                              ? "rgba(255, 255, 255, 0.12)"
                              : "rgba(212, 175, 55, 0.2)",
                            backdropFilter: "blur(16px) saturate(1.5)",
                            WebkitBackdropFilter: "blur(16px) saturate(1.5)",
                            border: isAssistant
                              ? "1px solid rgba(255, 255, 255, 0.2)"
                              : "1px solid rgba(212, 175, 55, 0.3)",
                            boxShadow: `
                              0 4px 24px rgba(0, 0, 0, 0.4),
                              inset 0 1px 0 rgba(255, 255, 255, 0.1)
                            `,
                          }}
                        >
                          <p className="text-white leading-relaxed whitespace-pre-wrap font-medium">
                            {message.content}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
                
                {/* Streaming Message */}
                {streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-2xl rounded-bl-none p-3 md:p-4 max-w-[85%] md:max-w-[75%] text-sm md:text-base"
                      style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        backdropFilter: "blur(16px) saturate(1.5)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <p className="text-white leading-relaxed whitespace-pre-wrap font-medium">
                        {streamingContent}
                        <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
                      </p>
                    </div>
                  </motion.div>
                )}
                
                {/* Loading Indicator (when waiting for first chunk) */}
                {isLoading && !streamingContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-2xl rounded-bl-none p-4 md:p-5"
                      style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        backdropFilter: "blur(16px) saturate(1.5)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                        </div>
                        <span className="text-white/60 text-sm font-medium">Otter is thinking...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Lifecycle System Message */}
                {!lifecycle.canInteract && lifecycle.systemMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center my-8"
                  >
                    <div
                      className="rounded-2xl p-4 md:p-6 max-w-[90%] text-center"
                      style={{
                        background: "rgba(239, 68, 68, 0.15)",
                        backdropFilter: "blur(16px) saturate(1.5)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        boxShadow: "0 8px 32px rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      <p className="text-white font-bold text-lg md:text-xl mb-1">
                        {lifecycle.systemMessage}
                      </p>
                      <p className="text-white/60 text-sm">
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

      {/* Input Section - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-3 md:px-4 pb-4 md:pb-6 pt-6 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-3 md:gap-4">
        
        {/* Mic Button Row - Centered */}
        <div className="flex justify-center items-center gap-3 md:gap-4">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md flex-shrink-0"
            disabled={!lifecycle.canInteract}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Volume2 className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </Button>

          <Button
            onClick={toggleRecording}
            type="button"
            disabled={!lifecycle.canInteract}
            className={`w-12 h-12 md:w-16 md:h-16 rounded-full border border-white/10 transition-all duration-200 shadow-lg flex-shrink-0 ${
              isRecording 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/50 animate-pulse scale-110" 
                : !lifecycle.canInteract
                ? "bg-white/5 text-white/20 cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/20 hover:text-white hover:scale-105"
            }`}
          >
            {isRecording ? (
              <Square className="w-4 h-4 md:w-6 md:h-6 fill-current" />
            ) : (
              <Mic className="w-5 h-5 md:w-8 md:h-8" />
            )}
          </Button>

          <div className="w-9 md:w-10" /> {/* Spacer to balance Mute button */}
        </div>

        {/* Input Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto flex items-center gap-2 w-full"
        >
          <Button
            onClick={() => {
              // Trigger lower50 GIF when hiding chat
              if (isChatVisible && onHideChat) {
                onHideChat()
              }
              setIsChatVisible(!isChatVisible)
            }}
            className="bg-white/10 hover:bg-white/20 text-white rounded-xl md:rounded-2xl w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center backdrop-blur-md border border-white/20 transition-all"
          >
            {isChatVisible ? (
              <EyeOff className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Eye className="w-4 h-4 md:w-5 md:h-5" />
            )}
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
            className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm backdrop-blur-md disabled:opacity-50"
            disabled={isLoading || !lifecycle.canInteract}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading || !lifecycle.canInteract}
            className="bg-primary text-black hover:bg-primary/90 rounded-xl md:rounded-2xl w-10 h-10 md:w-12 md:h-12 flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </Button>
        </motion.div>

        {/* Powered by OpenSouls */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pb-safe"
        >
          <p className="text-[9px] md:text-[10px] text-white/30 font-medium tracking-tight">
            powered by <span className="text-white/50 font-bold">opensouls</span>
          </p>
        </motion.div>
      </div>

      {/* Camera Preview Card - Bottom Right */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed bottom-5 right-5 z-50 w-[200px] h-[150px]"
        style={{
          pointerEvents: "auto",
        }}
      >
        <div
          className="relative w-full h-full rounded-lg overflow-hidden"
          style={{
            backgroundColor: "#020617",
            border: "2px solid rgba(255,255,255,0.18)",
            boxShadow:
              "0 18px 50px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.08)",
            backdropFilter: "blur(18px) saturate(1.5)",
            WebkitBackdropFilter: "blur(18px) saturate(1.5)",
          }}
        >
          {/* Video or placeholder */}
          {isCameraOn ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/60 text-xs">
              <Camera className="w-6 h-6 opacity-70" />
              <span className="px-4 text-center">Click the camera to enable visual context</span>
            </div>
          )}

          {/* Top bar status */}
          <div className="absolute top-1.5 left-2 flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isCameraOn ? "bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.25)]" : "bg-zinc-500"
              }`}
            />
            <span className="text-[10px] font-medium text-white/80">
              {isCameraOn ? "Camera Active" : "Camera Off"}
            </span>
          </div>

          {/* Controls */}
          <div className="absolute bottom-1.5 right-2 flex items-center gap-1.5">
            {isCameraOn && (
              <button
                type="button"
                onClick={async () => {
                  // Manual refresh of visual context (capture frame only)
                  setIsCameraProcessing(true)
                  try {
                    await captureFrameAsDataUrl()
                  } finally {
                    setIsCameraProcessing(false)
                  }
                }}
                className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 text-white transition-colors"
                title="Refresh visual context"
              >
                <Loader2
                  className={`w-3.5 h-3.5 ${isCameraProcessing ? "animate-spin" : ""}`}
                />
              </button>
            )}
            <button
              type="button"
              onClick={toggleCamera}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black/70 hover:bg-black/90 border border-white/15 text-white transition-colors"
              title={isCameraOn ? "Turn camera off" : "Turn camera on"}
            >
              {isCameraOn ? (
                <CameraOff className="w-4 h-4" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Processing overlay */}
          {isCameraProcessing && (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2 text-[11px] text-white">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Analyzing frame…</span>
            </div>
          )}
        </div>
      </motion.div>
    </>
  )
}
