"use client"

import { useState, useEffect } from "react"
import { FullscreenOtterDisplay } from "@/components/fullscreen-otter-display"
import { SideChatBubbles } from "@/components/side-chat-bubbles"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { type Sentiment } from "@/lib/sentiment-analyzer"
import { useTokenPrice } from "@/components/token-price-fetcher"

export default function ChatPage() {
  const [chatSentiment, setChatSentiment] = useState<Sentiment | null>(null)
  
  // Lifted state for price and mood
  const { priceData } = useTokenPrice(10000)
  const [basePrice, setBasePrice] = useState<number>(0)
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle">("idle")
  
  // Set base price on first load
  useEffect(() => {
    if (priceData.price > 0 && basePrice === 0) {
      setBasePrice(priceData.price)
    }
  }, [priceData.price, basePrice])

  // Calculate price change and mood
  const priceChangePercent = basePrice > 0 
    ? ((priceData.price - basePrice) / basePrice) * 100 
    : 0
  const priceThreshold = 0.1 // 0.1% threshold

  const trend = priceChangePercent >= priceThreshold
    ? "up"
    : priceChangePercent <= -priceThreshold
    ? "down"
    : "neutral"

  useEffect(() => {
    if (priceData.price > 0 && basePrice > 0) {
      let newState: "happy" | "sad" | "idle" = gifState
      
      // Priority 1: Chat sentiment
      if (chatSentiment === "positive") {
        newState = "happy"
      } else if (chatSentiment === "negative") {
        newState = "sad"
      }
      // Priority 2: Price movement
      else if (chatSentiment === "neutral" || chatSentiment === null) {
        if (priceChangePercent >= priceThreshold) {
          newState = "happy"
        } else if (priceChangePercent <= -priceThreshold) {
          newState = "sad"
        } else {
          newState = "idle"
        }
      }
      
      if (newState !== gifState) {
        setGifState(newState)
      }
    }
  }, [priceData, basePrice, chatSentiment, gifState, priceChangePercent, priceThreshold])

  return (
    <main className="fixed inset-0 w-full h-screen overflow-hidden bg-black">
      {/* Full Screen Otter Display with Chart Background */}
      <FullscreenOtterDisplay 
        chatSentiment={chatSentiment}
        priceData={priceData}
        basePrice={basePrice}
        gifState={gifState}
        trend={trend}
        priceChangePercent={priceChangePercent}
      />

      {/* Navigation Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50"
      >
        <Link
          href="/"
          className="group flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-white hover:bg-white/10 transition-all duration-300"
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs md:text-sm font-medium">Back</span>
        </Link>
      </motion.div>

      {/* Side Chat Bubbles - Left and Right of GIF with Input at Bottom */}
      <SideChatBubbles 
        onSentimentChange={setChatSentiment} 
        currentMood={gifState}
        currentTrend={trend}
        currentSentiment={chatSentiment}
      />
    </main>
  )
}

