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
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Lifted state for price and mood
  const { priceData } = useTokenPrice(5000)
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle">("idle")
  const [selectedInterval, setSelectedInterval] = useState<"m5" | "h1" | "h24">("m5")

  // Get the rate of change for the selected interval
  const intervalChange = priceData.priceChanges?.[selectedInterval] || 0

  // Determine trend based on selected interval
  const trend = intervalChange > 0
    ? "up"
    : intervalChange < 0
    ? "down"
    : "neutral"

  // Determine if we're in an "angry" state (negative sentiment OR negative price)
  const isAngry = chatSentiment === "negative" || intervalChange < 0

  useEffect(() => {
    if (priceData.price > 0) {
      let newState: "happy" | "sad" | "idle" = gifState
      
      // If angry (negative sentiment or price down) → always sad
      if (isAngry) {
        newState = "sad"
      }
      // If happy/positive state
      else if (chatSentiment === "positive" || intervalChange > 0) {
        // If speaking → happy GIF
        if (isSpeaking) {
          newState = "happy"
        } else {
          // Not speaking → idle GIF
          newState = "idle"
        }
      }
      // Neutral state
      else {
        newState = isSpeaking ? "happy" : "idle"
      }
      
      if (newState !== gifState) {
        setGifState(newState)
      }
    }
  }, [priceData, chatSentiment, gifState, intervalChange, selectedInterval, isSpeaking, isAngry])

  return (
    <main className="fixed inset-0 w-full h-screen overflow-hidden bg-black">
      {/* Full Screen Otter Display with Chart Background */}
      <FullscreenOtterDisplay 
        chatSentiment={chatSentiment}
        priceData={priceData}
        gifState={gifState}
        trend={trend}
        priceChangePercent={intervalChange}
        selectedInterval={selectedInterval}
        onIntervalChange={setSelectedInterval}
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
        onSpeakingChange={setIsSpeaking}
        currentMood={gifState}
        currentTrend={trend}
        currentSentiment={chatSentiment}
      />
    </main>
  )
}

