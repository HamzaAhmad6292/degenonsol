"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, Volume2, VolumeX, Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

// Add type definition for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function OtterChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hey there! I'm the $DEGEN otter! 🦦 How's your day going?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const [isMuted, setIsMuted] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const conversationIdRef = useRef<string>(`conv-${Date.now()}`)
  const recognitionRef = useRef<any>(null)
  const [useWebSocket, setUseWebSocket] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage])

  // TTS Function
  const speakText = (text: string, mood: string = "neutral") => {
    if (isMuted || typeof window === "undefined") return

    // Cancel any current speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Select a voice (prefer English)
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0]
    if (preferredVoice) utterance.voice = preferredVoice

    // Adjust voice based on mood
    switch (mood) {
      case "angry":
        utterance.rate = 1.2
        utterance.pitch = 0.8
        break
      case "excited":
        utterance.rate = 1.1
        utterance.pitch = 1.2
        break
      case "depressed":
        utterance.rate = 0.8
        utterance.pitch = 0.6
        break
      default:
        utterance.rate = 1.0
        utterance.pitch = 1.0
    }

    window.speechSynthesis.speak(utterance)
  }

  // Initialize WebSocket connection
  useEffect(() => {
    const wsPort = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || "8080"
    const wsUrl = `ws://localhost:${wsPort}`

    try {
      const ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket connected")
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
          console.log("WebSocket initialized:", data.conversationId)
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
          console.error("WebSocket error:", data.error)
          setIsLoading(false)
          setIsTyping(false)
          setCurrentStreamingMessage("")
        }
      }

      ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        setUseWebSocket(false)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
        setUseWebSocket(false)
      }

      wsRef.current = ws

      return () => {
        ws.close()
      }
    } catch (error) {
      console.error("Failed to connect WebSocket, using REST API:", error)
      setUseWebSocket(false)
    }
  }, [isMuted])

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
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
          } else {
            // Optional: Handle interim results if you want to show them
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
        setIsRecording(false)
      }

      recognition.start()
      recognitionRef.current = recognition
    }
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = input.trim()
    setInput("")
    setIsLoading(true)
    setCurrentStreamingMessage("")

    try {
      if (useWebSocket && wsRef.current?.readyState === WebSocket.OPEN) {
        // Use WebSocket
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            content: messageContent,
          })
        )
      } else {
        // Fallback to REST API
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: messageContent,
            conversationId: conversationIdRef.current,
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
        speakText(data.response, "neutral")
      }
    } catch (error) {
      console.error("Error sending message:", error)
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

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-black/40 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="p-6 border-b border-white/10 bg-black/20 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-serif text-primary">Chat with Otter</h3>
          <p className="text-white/60 text-sm mt-1">Ask me anything about $DEGEN!</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="text-white/60 hover:text-white hover:bg-white/10"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-4 ${
                  message.role === "user"
                    ? "bg-primary/20 text-white border border-primary/30"
                    : "bg-white/5 text-white border border-white/10"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs text-white/40 mt-2">
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {(isLoading || isTyping) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 text-white border border-white/10 rounded-2xl p-4">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </motion.div>
        )}
        {currentStreamingMessage && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-white/5 text-white border border-white/10 rounded-2xl p-4 max-w-[80%] md:max-w-[70%]">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {currentStreamingMessage}
                <span className="animate-pulse">▊</span>
              </p>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10 bg-black/20 flex flex-col gap-4">
        {/* Mic Button - Centered Above */}
        <div className="flex justify-center">
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
        </div>

        {/* Text Input Row */}
        <div className="flex gap-3">
          <input
            ref={inputRef}
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
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

