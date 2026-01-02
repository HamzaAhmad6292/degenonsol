"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

interface CandleData {
  open: number
  high: number
  low: number
  close: number
  time: number
}

interface CandlestickChartProps {
  data: CandleData[]
  isPositive: boolean
  className?: string
}

export function CandlestickChart({ data, isPositive, className }: CandlestickChartProps) {
  const [animatedData, setAnimatedData] = useState<CandleData[]>(data)

  useEffect(() => {
    // Set data immediately for instant display
    if (data.length > 0) {
      // If we have no animated data yet, set it immediately
      if (animatedData.length === 0) {
        setAnimatedData(data)
      } else {
        // Keep existing data and add new ones with animation
        const existingIds = new Set(animatedData.map(d => d.time))
        const newCandles = data.filter(d => !existingIds.has(d.time))
        
        if (newCandles.length > 0) {
          // Animate only new candles
          newCandles.forEach((candle, index) => {
            setTimeout(() => {
              setAnimatedData((prev) => [...prev, candle])
            }, index * 50)
          })
        } else {
          // If no new candles, just update the data
          setAnimatedData(data)
        }
      }
    }
  }, [data, animatedData.length])

  if (animatedData.length === 0 && data.length === 0) return null

  const maxPrice = Math.max(...animatedData.map((d) => d.high))
  const minPrice = Math.min(...animatedData.map((d) => d.low))
  const priceRange = maxPrice - minPrice || 1

  const candleColor = isPositive ? "#22c55e" : "#ef4444"
  const wickColor = isPositive ? "#16a34a" : "#dc2626"
  
  // Make chart more visible with stronger, brighter colors
  const enhancedCandleColor = isPositive ? "#10b981" : "#f87171"
  const enhancedWickColor = isPositive ? "#22c55e" : "#ef4444"
  
  // Even brighter colors for better visibility
  const brightCandleColor = isPositive ? "#34d399" : "#fb7185"
  const brightWickColor = isPositive ? "#4ade80" : "#f87171"

  return (
    <div 
      className={`absolute left-0 right-0 ${className || ""}`} 
      style={{ 
        zIndex: 1, 
        top: "50%",
        transform: "translateY(-50%)",
        height: "40%",
        width: "100%",
        padding: "0 5%"
      }}
    >
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ mixBlendMode: "screen" }}>
        {animatedData.map((candle, index) => {
          const x = (index / Math.max(animatedData.length - 1, 1)) * 100
          const width = Math.max(100 / Math.max(animatedData.length, 10) / 2, 1.2)
          
          const openY = 100 - ((candle.open - minPrice) / priceRange * 100)
          const closeY = 100 - ((candle.close - minPrice) / priceRange * 100)
          const highY = 100 - ((candle.high - minPrice) / priceRange * 100)
          const lowY = 100 - ((candle.low - minPrice) / priceRange * 100)

          const isUp = candle.close >= candle.open
          const bodyTop = Math.min(openY, closeY)
          const bodyBottom = Math.max(openY, closeY)
          const bodyHeight = Math.max(bodyBottom - bodyTop, 0.8)
          
          // Determine if candle is rising or falling
          const isRising = isUp
          const animationDelay = index * 0.08

          return (
            <g key={`candle-${index}-${candle.time}`}>
              {/* Wick - Animated falling/rising effect */}
              <motion.line
                initial={{ 
                  y1: isRising ? lowY : highY, 
                  y2: isRising ? lowY : highY, 
                  opacity: 0 
                }}
                animate={{ 
                  y1: highY, 
                  y2: lowY, 
                  opacity: 1,
                  scaleY: [0.5, 1, 1]
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: animationDelay,
                  ease: isRising ? "easeOut" : "easeIn"
                }}
                x1={x}
                x2={x}
                stroke={brightWickColor}
                strokeWidth="1.2"
                style={{ 
                  filter: "drop-shadow(0 0 3px currentColor)",
                  transformOrigin: `${x}% ${highY}%`
                }}
              />
              {/* Body - Animated falling/rising with bounce effect */}
              <motion.rect
                initial={{ 
                  height: 0, 
                  y: isRising ? bodyBottom : bodyTop, 
                  opacity: 0,
                  scaleY: 0
                }}
                animate={{ 
                  height: bodyHeight, 
                  y: bodyTop, 
                  opacity: 1,
                  scaleY: [0, 1.1, 1]
                }}
                transition={{ 
                  duration: 0.6, 
                  delay: animationDelay,
                  ease: isRising ? "easeOut" : "easeIn"
                }}
                x={x - width / 2}
                width={width}
                fill={isUp ? brightCandleColor : "#fb7185"}
                rx="0.8"
                style={{ 
                  filter: "drop-shadow(0 0 4px currentColor)",
                  transformOrigin: `${x}% ${bodyTop}%`
                }}
              />
              {/* Glow effect for rising candles */}
              {isRising && (
                <motion.circle
                  initial={{ opacity: 0, r: 0 }}
                  animate={{ 
                    opacity: [0, 0.3, 0],
                    r: [0, width * 2, width * 2]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: animationDelay + 0.3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  cx={x}
                  cy={bodyTop + bodyHeight / 2}
                  fill={brightCandleColor}
                />
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

