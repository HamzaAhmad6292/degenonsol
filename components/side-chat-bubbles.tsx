"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2 } from "lucide-react"
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
}

export function SideChatBubbles({ onSentimentChange }: SideChatBubblesProps) {
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
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const conversationIdRef = useRef<string>(`conv-${Date.now()}`)
  const [useWebSocket, setUseWebSocket] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamingMessage])

  // Initialize WebSocket connection
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
  }, [])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    // Analyze sentiment of user message
    const sentiment = analyzeSentiment(input.trim())
    if (onSentimentChange) {
      // Always update sentiment (including neutral) so GIF can follow price when neutral
      onSentimentChange(sentiment)
    }

    setMessages((prev) => [...prev, userMessage])
    const messageContent = input.trim()
    setInput("")
    setIsLoading(true)
    setCurrentStreamingMessage("")

    try {
      if (useWebSocket && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "message",
            content: messageContent,
          })
        )
      } else {
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

  return (
    <>
      {/* Conversation Flow - Messages in order with alternating sides */}
      <div 
        ref={messagesEndRef}
        className="absolute left-1/2 -translate-x-1/2 top-[35%] z-30 w-[90%] max-w-2xl max-h-[50vh] overflow-y-auto pointer-events-none"
      >
        <div className="relative space-y-3">
          <AnimatePresence>
            {messages.map((message) => {
              const isAssistant = message.role === "assistant"
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.9 }}
                  className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`rounded-2xl p-3 max-w-[70%] text-sm ${
                      isAssistant ? "ml-0" : "mr-0"
                    }`}
                    style={{
                      background: isAssistant
                        ? "rgba(255, 255, 255, 0.15)"
                        : "rgba(212, 175, 55, 0.25)",
                      backdropFilter: "blur(12px) saturate(1.2)",
                      WebkitBackdropFilter: "blur(12px) saturate(1.2)",
                      border: isAssistant
                        ? "1px solid rgba(255, 255, 255, 0.3)"
                        : "1px solid rgba(212, 175, 55, 0.4)",
                      boxShadow: `
                        0 8px 32px rgba(0, 0, 0, 0.3),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2)
                      `,
                    }}
                  >
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div
                className="rounded-2xl p-3"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(12px) saturate(1.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              </div>
            </motion.div>
          )}
          
          {/* Streaming Message */}
          {currentStreamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div
                className="rounded-2xl p-3 max-w-[70%] text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(12px) saturate(1.2)",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                }}
              >
                <p className="text-white leading-relaxed whitespace-pre-wrap">
                  {currentStreamingMessage}
                  <span className="animate-pulse">▊</span>
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input Section - Bottom Center */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
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
            placeholder="Type your message..."
            className="flex-1 bg-white/15 border border-white/30 rounded-2xl px-4 py-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
            style={{
              backdropFilter: "blur(12px) saturate(1.2)",
              WebkitBackdropFilter: "blur(12px) saturate(1.2)",
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.2)
              `,
            }}
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-primary text-black hover:bg-primary/90 rounded-2xl px-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[50px]"
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

