"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTokenPrice } from "./token-price-fetcher"
import { TokenLineChart } from "./token-line-chart"

interface PricePoint {
  price: number
  time: number
}

interface FullscreenOtterDisplayProps {
  chatSentiment?: "positive" | "negative" | "neutral" | null
}

export function FullscreenOtterDisplay({ chatSentiment = null }: FullscreenOtterDisplayProps) {
  const { priceData, loading } = useTokenPrice(10000)
  // Initialize with idle state and white glow
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle">("idle")
  const [previousGifState, setPreviousGifState] = useState<"happy" | "sad" | "idle" | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [basePrice, setBasePrice] = useState<number>(0)
  
  // Set base price on first load
  useEffect(() => {
    if (priceData.price > 0 && basePrice === 0) {
      setBasePrice(priceData.price)
      // Initialize price history with current price
      setPriceHistory([{ price: priceData.price, time: Date.now() }])
    }
  }, [priceData.price, basePrice])

  // Calculate price change for glow effect and GIF logic
  const priceChangePercent = basePrice > 0 
    ? ((priceData.price - basePrice) / basePrice) * 100 
    : 0
  const priceThreshold = 2 // 2% threshold

  useEffect(() => {
    if (priceData.price > 0 && basePrice > 0) {
      // Determine GIF state based on sentiment or price (if neutral)
      let newState: "happy" | "sad" | "idle" = gifState
      
      // Priority 1: Chat sentiment (if positive or negative)
      if (chatSentiment === "positive") {
        newState = "happy"
      } else if (chatSentiment === "negative") {
        newState = "sad"
      }
      // Priority 2: For neutral sentiment, follow price movement (2% threshold)
      else if (chatSentiment === "neutral" || chatSentiment === null) {
        if (priceChangePercent >= priceThreshold) {
          newState = "happy"
        } else if (priceChangePercent <= -priceThreshold) {
          newState = "sad"
        } else {
          // If price change is less than 2%, keep idle
          newState = "idle"
        }
      }
      
      // Only update if state changed
      if (newState !== gifState) {
        setPreviousGifState(gifState)
        setGifState(newState)
        // Clear previous state after transition
        setTimeout(() => setPreviousGifState(null), 500)
      }

      // Update price history
      const now = Date.now()
      setPriceHistory((prev) => {
        const newHistory = [...prev, { price: priceData.price, time: now }]
        // Keep last 30 data points for a smooth line
        return newHistory.slice(-30)
      })
    }
  }, [priceData, basePrice, chatSentiment, gifState, priceChangePercent, priceThreshold])

  // Glow colors: Based entirely on price movement (2% threshold)
  
  const glowColor = priceChangePercent >= priceThreshold
    ? "rgba(34, 197, 94, 0.5)" // Green for price increase
    : priceChangePercent <= -priceThreshold
    ? "rgba(239, 68, 68, 0.4)" // Red for price decrease
    : "rgba(255, 255, 255, 0.3)" // White glow for idle (no significant change)
  
  const gifPath = `/gifs/${gifState}.gif`
  // For chart color, use price movement (2% threshold)
  const isPositive = priceChangePercent >= priceThreshold

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Background with Glow Effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
        style={{
          background: `linear-gradient(135deg, ${
            priceChangePercent >= priceThreshold
              ? "rgba(34, 197, 94, 0.15)" // Green for price increase
              : priceChangePercent <= -priceThreshold
              ? "rgba(239, 68, 68, 0.1)" // Red for price decrease
              : "rgba(255, 255, 255, 0.05)" // White for idle (no significant change)
          } 0%, rgba(0, 0, 0, 0.85) 100%)`,
          boxShadow: `0 0 80px ${glowColor}, inset 0 0 80px ${glowColor}`,
        }}
      >
        {/* Animated Line Chart Background - Always Visible */}
        <div className="absolute inset-0 z-0">
          <TokenLineChart 
            data={priceHistory.length > 0 ? priceHistory : [{
              price: priceData.price || 0.0001,
              time: Date.now(),
            }]} 
            isPositive={isPositive}
            className="opacity-80"
          />
        </div>
        
        {/* Additional subtle grid overlay for better visibility */}
        {priceHistory.length > 0 && (
          <div className="absolute inset-0 opacity-5">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(${isPositive ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"} 1px, transparent 1px),
                  linear-gradient(90deg, ${isPositive ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)"} 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
          </div>
        )}
      </div>

      {/* GIF Display - Full Screen, Centered - Always Visible */}
      <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Previous GIF - fading out */}
          {previousGifState && previousGifState !== gifState && (
            <motion.img
              key={`prev-${previousGifState}`}
              src={`/gifs/${previousGifState}.gif`}
              alt={`Otter ${previousGifState}`}
              className="absolute w-full h-full object-contain max-w-[90vw] max-h-[90vh]"
              style={{
                imageRendering: "auto",
              }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          )}
          {/* Current GIF - always visible */}
          <motion.img
            key={`current-${gifState}`}
            src={gifPath}
            alt={`Otter ${gifState}`}
            className="absolute w-full h-full object-contain max-w-[90vw] max-h-[90vh]"
            style={{
              imageRendering: "auto",
            }}
            initial={{ opacity: previousGifState ? 0 : 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.style.display = "none"
            }}
          />
        </div>
      </div>

      {/* Price Display - Bottom Left */}
      <div className="absolute bottom-6 left-6 z-20">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">$DEGEN</p>
              <p className="text-white text-2xl font-bold">
                ${priceData.price > 0 ? priceData.price.toFixed(6) : "0.000000"}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-semibold ${
                priceData.priceChange === "up" ? "text-green-400" : 
                priceData.priceChange === "down" ? "text-red-400" : 
                "text-white/60"
              }`}>
                {priceData.priceChange === "up" ? "↑" : 
                 priceData.priceChange === "down" ? "↓" : 
                 "→"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

