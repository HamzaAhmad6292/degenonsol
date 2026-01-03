"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Eye, EyeOff, Mic, Square, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analyzeSentiment, type Sentiment } from "@/lib/sentiment-analyzer"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface SideChatBubblesProps {
  onSentimentChange?: (sentiment: Sentiment | null) => void
  currentMood: "happy" | "sad" | "idle"
  currentTrend: "up" | "down" | "neutral"
  currentSentiment?: Sentiment | null
}

// Add type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function SideChatBubbles({ onSentimentChange, currentMood, currentTrend, currentSentiment }: SideChatBubblesProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey! I'm the $DEGEN otter! 🦦",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [isChatVisible, setIsChatVisible] = useState(true)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const conversationIdRef = useRef<string>(`conv-${Date.now()}`)
  const recognitionRef = useRef<any>(null)
  const inputValueRef = useRef("") // Ref to keep track of input for auto-send
  const [useWebSocket, setUseWebSocket] = useState(false) // Default to false for API usage

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage])

  // Sync ref with state
  useEffect(() => {
    inputValueRef.current = input
  }, [input])

  // TTS Function (OpenAI)
  const speakText = async (text: string, mood: string = "neutral") => {
    if (isMuted || typeof window === "undefined") return

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mood }),
      })

      if (!response.ok) throw new Error("TTS request failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      
      audio.onended = () => {
        URL.revokeObjectURL(url)
      }
      
      await audio.play()
    } catch (error) {
      console.error("TTS Error:", error)
    }
  }

  // Initialize WebSocket connection - DISABLED for API usage
  /*
  useEffect(() => {
    const wsPort = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || "8080"
    const wsUrl = `ws://localhost:${wsPort}`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        setUseWebSocket(true)
        ws.send(
          JSON.stringify({
            type: "init",
            conversationId: conversationIdRef.current,
          })
        )
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        if (data.type === "connected") {
          conversationIdRef.current = data.conversationId
        } else if (data.type === "typing") {
          setIsTyping(data.isTyping)
        } else if (data.type === "chunk") {
          setCurrentStreamingMessage((prev) => prev + data.content)
        } else if (data.type === "complete") {
          const assistantMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: data.message,
            timestamp: new Date(),
          }
          setMessages((prev) => [...prev, assistantMessage])
          setCurrentStreamingMessage("")
          setIsTyping(false)
          setIsLoading(false)
          
          // Trigger Voice
          speakText(data.message, data.mood)
        } else if (data.type === "error") {
          setIsLoading(false)
          setIsTyping(false)
          setCurrentStreamingMessage("")
        }
      }

      ws.onerror = () => {
        setUseWebSocket(false)
      }

      ws.onclose = () => {
        setUseWebSocket(false)
      }

      wsRef.current = ws

      return () => {
        ws.close()
      }
    } catch (error) {
      setUseWebSocket(false)
    }
  }, [isMuted])
  */

  const handleSend = async (textOverride?: string, origin: "voice" | "text" = "text") => {
    const textToSend = textOverride || input
    if (!textToSend.trim() || isLoading) return
    
    // Ensure chat is visible when sending
    if (!isChatVisible) setIsChatVisible(true)

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend.trim(),
      timestamp: new Date(),
    }

    // Analyze sentiment of user message using LLM
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
        if (onSentimentChange) {
          onSentimentChange(sentiment)
        }
      }
    } catch (error) {
      console.error("Sentiment analysis failed:", error)
    }

    // Determine mood to send to API based on FRESH sentiment
    // This ensures immediate reaction to the current message
    let moodToSend = currentMood
    if (freshSentiment === "negative") {
      moodToSend = "angry" // Force angry mood for negative sentiment to trigger rude behavior
    } else if (freshSentiment === "positive") {
      moodToSend = "happy" // Force happy mood for positive sentiment
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setCurrentStreamingMessage("")

    try {
      if (useWebSocket && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            content: textToSend.trim(),
            mood: moodToSend,
            trend: currentTrend
          })
        )
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: textToSend.trim(),
            conversationId: conversationIdRef.current,
            mood: moodToSend,
            trend: currentTrend
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get response")
        }

        const data = await response.json()

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
        
        // Only speak if the message originated from voice input
        if (origin === "voice") {
          speakText(data.response, "neutral")
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Oops! Something went wrong. Let me try again! 🦦",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
      setIsLoading(false)
      setCurrentStreamingMessage("")
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      // Auto-send after a brief delay to allow final transcript
      setTimeout(() => {
        if (inputValueRef.current.trim()) {
          handleSend(inputValueRef.current, "voice")
        }
      }, 500)
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
  }

  return (
    <>
      <AnimatePresence>
        {isChatVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className="fixed inset-x-0 top-20 bottom-24 z-30 overflow-y-auto scrollbar-luxury pointer-events-auto"
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
                
                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div
                      className="rounded-2xl rounded-bl-none p-3"
                      style={{
                        background: "rgba(255, 255, 255, 0.12)",
                        backdropFilter: "blur(16px) saturate(1.5)",
                        border: "1px solid rgba(255, 255, 255, 0.2)",
                      }}
                    >
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Streaming Message */}
                {currentStreamingMessage && (
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
                        {currentStreamingMessage}
                        <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />
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
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pt-8 flex flex-col gap-4">
        
        {/* Mic Button - Centered Above Input */}
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => setIsMuted(!isMuted)}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </Button>

          <Button
            onClick={toggleRecording}
            type="button"
            className={`w-16 h-16 rounded-full border border-white/10 transition-all duration-200 shadow-lg ${
              isRecording 
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300 border-red-500/50 animate-pulse scale-110" 
                : "bg-white/10 text-white hover:bg-white/20 hover:text-white hover:scale-105"
            }`}
          >
            {isRecording ? (
              <Square className="w-6 h-6 fill-current" />
            ) : (
              <Mic className="w-8 h-8" />
            )}
          </Button>

          <div className="w-10" /> {/* Spacer to balance Mute button */}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto flex gap-2 w-full"
        >
          <Button
            onClick={() => setIsChatVisible(!isChatVisible)}
            className="bg-white/10 hover:bg-white/20 text-white rounded-2xl w-[52px] h-[52px] flex items-center justify-center backdrop-blur-md border border-white/20 transition-all"
          >
            {isChatVisible ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
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
            placeholder={isRecording ? "Listening..." : "Type your message..."}
            className="flex-1 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm backdrop-blur-md"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-4 md:px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[50px] shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </motion.div>
      </div>
    </>
  )
}
