"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTokenPrice } from "./token-price-fetcher"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts"

interface OtterGifDisplayProps {
  className?: string
}

export function OtterGifDisplay({ className }: OtterGifDisplayProps) {
  const { priceData, loading } = useTokenPrice(10000)
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle">("idle")
  const [priceHistory, setPriceHistory] = useState<Array<{ time: number; price: number }>>([])

  useEffect(() => {
    if (priceData.price > 0) {
      // Update price history
      setPriceHistory((prev) => {
        const newHistory = [
          ...prev,
          { time: Date.now(), price: priceData.price },
        ]
        // Keep last 20 data points
        return newHistory.slice(-20)
      })

      // Determine GIF state based on price change
      if (priceData.priceChange === "up") {
        setGifState("happy")
      } else if (priceData.priceChange === "down") {
        setGifState("sad")
      } else if (priceData.priceChange === "same" && priceData.previousPrice > 0) {
        // Only show sad if we have a previous price to compare
        setGifState("sad")
      }
    }
  }, [priceData])

  // Generate chart data
  const chartData = priceHistory.map((point, index) => ({
    time: index,
    price: point.price,
  }))

  const glowColor = gifState === "happy" 
    ? "rgba(34, 197, 94, 0.4)" 
    : gifState === "sad" 
    ? "rgba(239, 68, 68, 0.4)" 
    : "rgba(212, 175, 55, 0.2)" // Gold for idle
  const gifPath = `/gifs/${gifState}.gif`
  
  // Ensure we have at least 2 data points for the chart, or create a simple line
  const chartDataForDisplay = chartData.length >= 2 
    ? chartData 
    : chartData.length === 1 
    ? [chartData[0], { ...chartData[0], time: chartData[0].time + 1 }]
    : []

  return (
    <div className={`relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl ${className}`}>
      {/* Chart Background with Glow Effect */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out"
        style={{
          background: `linear-gradient(135deg, ${
            gifState === "happy" 
              ? "rgba(34, 197, 94, 0.1)" 
              : gifState === "sad" 
              ? "rgba(239, 68, 68, 0.1)" 
              : "rgba(212, 175, 55, 0.05)"
          } 0%, rgba(0, 0, 0, 0.8) 100%)`,
          boxShadow: `0 0 60px ${glowColor}, inset 0 0 60px ${glowColor}`,
        }}
      >
        {/* Chart Container */}
        {chartDataForDisplay.length > 0 && (
          <div className="absolute inset-0 opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartDataForDisplay}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop 
                      offset="0%" 
                      stopColor={
                        gifState === "happy" 
                          ? "rgba(34, 197, 94, 0.3)" 
                          : gifState === "sad" 
                          ? "rgba(239, 68, 68, 0.3)" 
                          : "rgba(212, 175, 55, 0.2)"
                      } 
                    />
                    <stop 
                      offset="100%" 
                      stopColor={
                        gifState === "happy" 
                          ? "rgba(34, 197, 94, 0)" 
                          : gifState === "sad" 
                          ? "rgba(239, 68, 68, 0)" 
                          : "rgba(212, 175, 55, 0)"
                      } 
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={
                    gifState === "happy" 
                      ? "#22c55e" 
                      : gifState === "sad" 
                      ? "#ef4444" 
                      : "#d4af37"
                  }
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Glass Effect Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10" />

      {/* GIF Display */}
      <div className="relative z-20 h-full flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={gifState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <img
              src={gifPath}
              alt={`Otter ${gifState}`}
              className="max-w-full max-h-[400px] md:max-h-[500px] object-contain"
              onError={(e) => {
                // Fallback if GIF doesn't exist
                const target = e.target as HTMLImageElement
                target.style.display = "none"
              }}
            />
            {/* Loading placeholder if GIF doesn't exist */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white/50 text-sm">Loading...</div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Price Display Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-30">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider mb-1">$DEGEN Price</p>
              <p className="text-white text-2xl font-bold">
                ${priceData.price.toFixed(6)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm font-semibold ${
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
        </div>
      </div>
    </div>
  )
}

