"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useTokenPrice } from "./token-price-fetcher"
import { CandlestickChart } from "./candlestick-chart"

interface CandleData {
  open: number
  high: number
  low: number
  close: number
  time: number
}

export function FullscreenOtterDisplay() {
  const { priceData, loading } = useTokenPrice(10000)
  // Initialize with happy state and green glow
  const [gifState, setGifState] = useState<"happy" | "sad" | "idle">("happy")
  const [previousGifState, setPreviousGifState] = useState<"happy" | "sad" | "idle" | null>(null)
  const [candleData, setCandleData] = useState<CandleData[]>([])
  const [currentCandle, setCurrentCandle] = useState<CandleData | null>(null)
  
  // Initialize with sample candle data so chart shows immediately
  useEffect(() => {
    if (candleData.length === 0 && currentCandle === null) {
      const now = Date.now()
      const samplePrice = priceData.price > 0 ? priceData.price : 0.0001
      // Create 10 sample candles for initial display
      const samples: CandleData[] = []
      for (let i = 0; i < 10; i++) {
        const variation = (Math.random() - 0.5) * 0.02 // ±1% variation
        samples.push({
          open: samplePrice * (1 + variation),
          high: samplePrice * (1 + Math.abs(variation) + 0.01),
          low: samplePrice * (1 - Math.abs(variation) - 0.01),
          close: samplePrice * (1 + variation * 0.5),
          time: now - (10 - i) * 10000,
        })
      }
      setCandleData(samples)
      setCurrentCandle({
        open: samplePrice,
        high: samplePrice,
        low: samplePrice,
        close: samplePrice,
        time: now,
      })
    }
  }, [candleData.length, currentCandle, priceData.price])

  useEffect(() => {
    if (priceData.price > 0) {
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

      // Update candlestick data
      const now = Date.now()
      const isPositive = priceData.priceChange === "up"

      if (!currentCandle) {
        // Start new candle
        setCurrentCandle({
          open: priceData.price,
          high: priceData.price,
          low: priceData.price,
          close: priceData.price,
          time: now,
        })
      } else {
        // Update current candle
        const updatedCandle: CandleData = {
          ...currentCandle,
          high: Math.max(currentCandle.high, priceData.price),
          low: Math.min(currentCandle.low, priceData.price),
          close: priceData.price,
        }
        setCurrentCandle(updatedCandle)

        // Every 10 seconds, close the candle and start a new one
        if (now - currentCandle.time > 10000) {
          setCandleData((prev) => {
            const newData = [...prev, updatedCandle]
            return newData.slice(-30) // Keep last 30 candles
          })
          setCurrentCandle({
            open: priceData.price,
            high: priceData.price,
            low: priceData.price,
            close: priceData.price,
            time: now,
          })
        }
      }
    }
  }, [priceData, currentCandle])

  // Initial state: green glow for happy
  const glowColor = gifState === "happy" 
    ? "rgba(34, 197, 94, 0.5)" 
    : gifState === "sad" 
    ? "rgba(239, 68, 68, 0.4)" 
    : "rgba(34, 197, 94, 0.3)" // Default to green instead of gold
  
  const gifPath = `/gifs/${gifState}.gif`
  const isPositive = priceData.priceChange === "up"
  const allCandles = currentCandle ? [...candleData, currentCandle] : candleData

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
        {/* Animated Candlestick Chart Background - Always Visible */}
        <div className="absolute inset-0 z-0">
          <CandlestickChart 
            data={allCandles.length > 0 ? allCandles : [{
              open: priceData.price || 0.0001,
              high: (priceData.price || 0.0001) * 1.01,
              low: (priceData.price || 0.0001) * 0.99,
              close: priceData.price || 0.0001,
              time: Date.now(),
            }]} 
            isPositive={isPositive || gifState === "happy"}
            className="opacity-60"
          />
        </div>
        
        {/* Additional subtle chart overlay for better visibility */}
        {allCandles.length > 0 && (
          <div className="absolute inset-0 opacity-10">
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

