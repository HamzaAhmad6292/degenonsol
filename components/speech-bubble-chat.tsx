"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface SpeechBubbleChatProps {
  className?: string
}

export function SpeechBubbleChat({ className }: SpeechBubbleChatProps) {
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
  const [isExpanded, setIsExpanded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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

    setMessages((prev) => [...prev, userMessage])
    const messageContent = input.trim()
    setInput("")
    setIsLoading(true)
    setCurrentStreamingMessage("")
    setIsExpanded(true)

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

  const latestMessage = messages[messages.length - 1]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed z-50 ${className || "bottom-[15%] left-1/2 -translate-x-1/2"}`}
      style={{
        // Glassmorphism styles
        background: "rgba(255, 255, 255, 0.15)",
        backdropFilter: "blur(12px) saturate(1.2)",
        WebkitBackdropFilter: "blur(12px) saturate(1.2)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          0 0 0 1px rgba(255, 255, 255, 0.1)
        `,
      }}
    >
      {!isExpanded ? (
        // Collapsed: Show as small speech bubble
        <motion.div
          className="rounded-2xl p-4 cursor-pointer min-w-[200px] max-w-[280px]"
          onClick={() => setIsExpanded(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <p className="text-sm text-white leading-relaxed">
            {latestMessage?.content || "Hey! I'm the $DEGEN otter! 🦦"}
          </p>
          <div className="absolute -bottom-2 left-8 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-[rgba(255,255,255,0.15)]" />
        </motion.div>
      ) : (
        // Expanded: Show full chat interface
        <div className="rounded-2xl overflow-hidden w-[90vw] max-w-md md:max-w-lg">
          {/* Header */}
          <div className="p-3 border-b border-white/20 bg-white/5 flex items-center justify-between">
            <h3 className="text-sm font-serif text-white">Chat with Otter</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="h-[300px] md:h-[350px] overflow-y-auto p-3 space-y-2 bg-black/10">
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
                    className={`max-w-[85%] rounded-xl p-2.5 text-sm ${
                      message.role === "user"
                        ? "bg-primary/30 text-white border border-primary/40"
                        : "bg-white/10 text-white border border-white/20"
                    }`}
                    style={{
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                    }}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap text-white">
                      {message.content}
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
                <div className="bg-white/10 text-white border border-white/20 rounded-xl p-2.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                </div>
              </motion.div>
            )}
            {currentStreamingMessage && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 text-white border border-white/20 rounded-xl p-2.5 max-w-[85%]">
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
          <div className="p-3 border-t border-white/20 bg-black/10">
            <div className="flex gap-2">
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
                placeholder="Type your message..."
                className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
                style={{
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
                disabled={isLoading}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="bg-primary text-black hover:bg-primary/90 rounded-lg px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[40px]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

