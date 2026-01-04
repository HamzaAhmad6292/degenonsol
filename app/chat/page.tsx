"use client"

import { useState, useEffect } from "react"
import { FullscreenOtterDisplay } from "@/components/fullscreen-otter-display"
import { SideChatBubbles } from "@/components/side-chat-bubbles"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { type Sentiment } from "@/lib/sentiment-analyzer"
import { useTokenPrice } from "@/components/token-price-fetcher"

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.76-.54-1.43-1.23-1.93-2.02V15.5c0 1.61-.46 3.23-1.53 4.43-1.14 1.32-2.86 2.1-4.58 2.06-1.93.03-3.85-.93-4.99-2.49-1.15-1.54-1.44-3.62-.81-5.39.54-1.62 1.92-2.95 3.55-3.43 1.05-.31 2.15-.32 3.23-.14V14.6c-.7-.2-1.48-.23-2.19-.06-1.02.23-1.93.94-2.34 1.91-.43 1.03-.36 2.27.24 3.2.6.93 1.64 1.51 2.73 1.48 1.14.04 2.25-.54 2.84-1.52.46-.75.65-1.64.63-2.51V.02z"></path>
  </svg>
)

export default function ChatPage() {
  const [chatSentiment, setChatSentiment] = useState<Sentiment | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  // Lifted state for price and mood
  const { priceData } = useTokenPrice(5000)
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle" | "sad_idle">("idle")
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
      let newState: "happy" | "sad" | "idle" | "sad_idle" = gifState
      
      // If angry (negative sentiment or price down)
      if (isAngry) {
        // If speaking → sad GIF, otherwise sad_idle GIF
        newState = isSpeaking ? "sad" : "sad_idle"
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

      {/* TikTok Button - Top Center */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <a
          href="https://tiktok.com/@marcelldegen"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 md:px-6 md:py-2 text-white hover:bg-white/10 transition-all duration-300 group shadow-lg"
        >
          <div className="w-4 h-4 md:w-5 md:h-5">
            <TikTokIcon />
          </div>
          <span className="text-xs md:text-sm font-bold tracking-tight">TikTok</span>
        </a>
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

