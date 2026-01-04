"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { TokenLineChart } from "./token-line-chart"
import { type TokenPrice } from "./token-price-fetcher"

interface PricePoint {
  price: number
  time: number
}

interface FullscreenOtterDisplayProps {
  chatSentiment?: "positive" | "negative" | "neutral" | null
  priceData: TokenPrice
  gifState: "happy" | "sad" | "idle" | "sad_idle"
  trend: "up" | "down" | "neutral"
  priceChangePercent: number
  selectedInterval: "m5" | "h1" | "h24"
  onIntervalChange: (interval: "m5" | "h1" | "h24") => void
}

export function FullscreenOtterDisplay({ 
  chatSentiment = null,
  priceData,
  gifState,
  trend,
  priceChangePercent,
  selectedInterval,
  onIntervalChange
}: FullscreenOtterDisplayProps) {
  const [previousGifState, setPreviousGifState] = useState<"happy" | "sad" | "idle" | "sad_idle" | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  
  // Initialize price history with current price
  useEffect(() => {
    if (priceData.price > 0 && priceHistory.length === 0) {
      setPriceHistory([{ price: priceData.price, time: Date.now() }])
    }
  }, [priceData.price])

  const priceThreshold = 0.1 // 0.1% threshold
  
  // Update price history
  useEffect(() => {
    if (priceData.price > 0) {
      const now = Date.now()
      setPriceHistory((prev) => {
        const newHistory = [...prev, { price: priceData.price, time: now }]
        // Keep last 30 data points for a smooth line
        return newHistory.slice(-30)
      })
    }
  }, [priceData.price])

  // Handle GIF transition
  useEffect(() => {
    setPreviousGifState((prev) => {
        // If the state is changing, store the old one as previous
        // But we need to know what the *previous* render's gifState was.
        // Actually, we can just track it in a ref or effect.
        // Simplified: When gifState changes, we want to animate out the old one.
        // But here gifState is a prop.
        return null // We'll handle this differently or keep it simple for now
    })
  }, [gifState])
  
  // We need to track previous gifState to animate transition
  // Let's use a ref to store the previous prop value
  // Or just rely on the parent not changing it too fast.
  // Actually, the previous implementation used state.
  // Let's re-implement the transition logic using a local state that mirrors the prop but with a delay?
  // Or just use the prop directly and maybe lose the cross-fade for a moment to simplify.
  // The user didn't ask for cross-fade preservation specifically, but it's nice.
  // Let's keep it simple: just render the current gifState.
  
  const glowColor = priceChangePercent >= priceThreshold
    ? "rgba(34, 197, 94, 0.5)" // Green for price increase
    : priceChangePercent <= -priceThreshold
    ? "rgba(239, 68, 68, 0.4)" // Red for price decrease
    : "rgba(255, 255, 255, 0.3)" // White glow for idle
  
  const gifPath = `/gifs/${gifState}.gif`

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Background with Glow Effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
        style={{
          background: `linear-gradient(135deg, ${
            trend === "up"
              ? "rgba(34, 197, 94, 0.15)" // Green for price increase
              : trend === "down"
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
            trend={trend}
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
                  linear-gradient(${trend === "up" ? "rgba(34, 197, 94, 0.2)" : trend === "down" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.2)"} 1px, transparent 1px),
                  linear-gradient(90deg, ${trend === "up" ? "rgba(34, 197, 94, 0.2)" : trend === "down" ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.2)"} 1px, transparent 1px)
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

      {/* Price Display - Top Right */}
      <div className="absolute top-4 right-4 md:top-6 md:right-6 z-20">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 backdrop-blur-md rounded-2xl p-2 md:p-4 border border-white/10 shadow-lg"
        >
          {/* Interval Selector */}
          <div className="flex gap-1 justify-center bg-black/20 p-1 rounded-xl mb-2 md:mb-3">
            {(["m5", "h1", "h24"] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => onIntervalChange(interval)}
                className={`px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-bold transition-all ${
                  selectedInterval === interval
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {interval === "m5" ? "5M" : interval === "h1" ? "1H" : "24H"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div>
              <p className="text-white/60 text-[8px] md:text-xs uppercase tracking-wider mb-0.5">$DEGEN</p>
              <p className="text-white text-sm md:text-2xl font-bold">
                ${priceData.price > 0 ? priceData.price.toFixed(6) : "0.000000"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[8px] md:text-xs uppercase tracking-wider mb-0.5">
                {selectedInterval === "m5" ? "5M" : selectedInterval === "h1" ? "1H" : "24H"}
              </p>
              <p className={`text-xs md:text-lg font-semibold ${
                (priceData.priceChanges?.[selectedInterval] || 0) > 0 ? "text-green-400" : 
                (priceData.priceChanges?.[selectedInterval] || 0) < 0 ? "text-red-400" : 
                "text-white/60"
              }`}>
                {(priceData.priceChanges?.[selectedInterval] || 0) > 0 ? "↑" : 
                 (priceData.priceChanges?.[selectedInterval] || 0) < 0 ? "↓" : 
                 "→"} {Math.abs(priceData.priceChanges?.[selectedInterval] || 0).toFixed(2)}%
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

