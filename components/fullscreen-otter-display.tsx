"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTokenPrice } from "./token-price-fetcher"
import { TokenLineChart } from "./token-line-chart"

interface PricePoint {
  price: number
  time: number
}

export function FullscreenOtterDisplay() {
  const { priceData, loading } = useTokenPrice(10000)
  // Initialize with happy state and green glow
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle">("happy")
  const [previousGifState, setPreviousGifState] = useState<"happy" | "sad" | "idle" | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [canChangeState, setCanChangeState] = useState(false)
  
  // Wait 5 seconds before allowing state changes - show happy on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanChangeState(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [])
  
  // Initialize with sample price data so chart shows immediately
  useEffect(() => {
    if (priceHistory.length === 0) {
      const now = Date.now()
      const samplePrice = priceData.price > 0 ? priceData.price : 0.0001
      // Create 20 sample points for initial display with a gentle upward trend
      const samples: PricePoint[] = []
      for (let i = 0; i < 20; i++) {
        // Create a smooth wave-like pattern with a slight upward trend
        const trendFactor = 1 + (i / 20) * 0.05 // 5% increase over time
        const waveFactor = Math.sin(i / 3) * 0.015 // Gentle wave ±1.5%
        const noiseFactor = (Math.random() - 0.5) * 0.005 // Small noise ±0.25%
        samples.push({
          price: samplePrice * trendFactor * (1 + waveFactor + noiseFactor),
          time: now - (20 - i) * 5000,
        })
      }
      setPriceHistory(samples)
    }
  }, [priceHistory.length, priceData.price])

  useEffect(() => {
    if (priceData.price > 0) {
      // Only change GIF state after initial 5-second delay
      if (canChangeState) {
        // Determine GIF state based on price change
        let newState: "happy" | "sad" | "idle" = gifState
        if (priceData.priceChange === "up") {
          newState = "happy"
        } else if (priceData.priceChange === "down") {
          newState = "sad"
        } else if (priceData.priceChange === "same" && priceData.previousPrice > 0) {
          newState = "sad"
        }
        
        // Only update if state changed
        if (newState !== gifState) {
          setPreviousGifState(gifState)
          setGifState(newState)
          // Clear previous state after transition
          setTimeout(() => setPreviousGifState(null), 500)
        }
      }

      // Update price history (always, regardless of delay)
      const now = Date.now()
      setPriceHistory((prev) => {
        const newHistory = [...prev, { price: priceData.price, time: now }]
        // Keep last 30 data points for a smooth line
        return newHistory.slice(-30)
      })
    }
  }, [priceData, gifState, canChangeState])

  // Initial state: green glow for happy
  const glowColor = gifState === "happy" 
    ? "rgba(34, 197, 94, 0.5)" 
    : gifState === "sad" 
    ? "rgba(239, 68, 68, 0.4)" 
    : "rgba(34, 197, 94, 0.3)" // Default to green instead of gold
  
  const gifPath = `/gifs/${gifState}.gif`
  const isPositive = priceData.priceChange === "up" || gifState === "happy"

  return (
    <div className="fixed inset-0 w-full h-screen overflow-hidden">
      {/* Background with Glow Effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
        style={{
          background: `linear-gradient(135deg, ${
            gifState === "happy" 
              ? "rgba(34, 197, 94, 0.15)" 
              : gifState === "sad" 
              ? "rgba(239, 68, 68, 0.1)" 
              : "rgba(34, 197, 94, 0.1)" // Default to green
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

