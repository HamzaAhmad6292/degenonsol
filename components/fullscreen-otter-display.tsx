"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { TokenLineChart } from "./token-line-chart"
import { type TokenPrice } from "./token-price-fetcher"
import { type GifState, type OneShotGif } from "@/app/chat/page"
import { type LifecycleInfo, STAGE_DURATIONS } from "@/lib/lifecycle"

interface PricePoint {
  price: number
  time: number
}

// EA-style witty loading messages for the birth phase
const BIRTH_LOADING_MESSAGES = [
  "Assembling otter consciousness...",
  "Loading cuteness algorithms...",
  "Syncing with the blockchain...",
  "Teaching Degen to say 'gm'...",
  "Warming up the servers...",
  "Almost there... (we've all heard that before)",
  "Initializing fluff physics...",
  "Downloading personality...",
  "Buffering charisma...",
  "Calibrating vibes...",
  "Unlocking the main character energy...",
  "Rendering cuteness in 4K...",
]

interface FullscreenOtterDisplayProps {
  chatSentiment?: "positive" | "negative" | "neutral" | null
  priceData: TokenPrice
  gifState: GifState
  trend: "up" | "down" | "neutral"
  priceChangePercent: number
  selectedInterval: "m5" | "h1" | "h24"
  onIntervalChange: (interval: "m5" | "h1" | "h24") => void
  onOtterClick?: (gif: OneShotGif) => void
  lifecycle: LifecycleInfo
}

export function FullscreenOtterDisplay({ 
  chatSentiment = null,
  priceData,
  gifState,
  trend,
  priceChangePercent,
  selectedInterval,
  onIntervalChange,
  onOtterClick,
  lifecycle
}: FullscreenOtterDisplayProps) {
  const [previousGifState, setPreviousGifState] = useState<GifState | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const otterContainerRef = useRef<HTMLDivElement>(null)
  const birthEndTimeRef = useRef<number>(0)
  const [, setBirthTick] = useState(0)
  const [birthMessageIndex, setBirthMessageIndex] = useState(0)

  // Birth phase: smooth loading bar and rotating messages
  useEffect(() => {
    if (lifecycle.stage !== "born" || lifecycle.nextStageIn == null) return
    birthEndTimeRef.current = Date.now() + lifecycle.nextStageIn
  }, [lifecycle.stage, lifecycle.nextStageIn])

  useEffect(() => {
    if (lifecycle.stage !== "born") return
    const interval = setInterval(() => {
      setBirthTick((t) => t + 1)
    }, 200)
    return () => clearInterval(interval)
  }, [lifecycle.stage])

  useEffect(() => {
    if (lifecycle.stage !== "born") return
    const interval = setInterval(() => {
      setBirthMessageIndex((i) => (i + 1) % BIRTH_LOADING_MESSAGES.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [lifecycle.stage])

  const birthProgress =
    lifecycle.stage === "born"
      ? Math.min(
          1,
          Math.max(
            0,
            (STAGE_DURATIONS.born - (birthEndTimeRef.current - Date.now())) / STAGE_DURATIONS.born
          )
        )
      : 0

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
        return null 
    })
  }, [gifState])
  
  // Handle click on otter - determine upper or lower half
  const handleOtterClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!onOtterClick || !otterContainerRef.current) return
    
    const rect = otterContainerRef.current.getBoundingClientRect()
    const clickY = e.clientY - rect.top
    const midpoint = rect.height / 2
    
    if (clickY < midpoint) {
      // Clicked on upper half
      onOtterClick("upper50")
    } else {
      // Clicked on lower half
      onOtterClick("lower50")
    }
  }, [onOtterClick])
  
  const glowColor = priceChangePercent >= priceThreshold
    ? "rgba(34, 197, 94, 0.5)" // Green for price increase
    : priceChangePercent <= -priceThreshold
    ? "rgba(239, 68, 68, 0.4)" // Red for price decrease
    : "rgba(255, 255, 255, 0.3)" // White glow for idle
  
  // Determine intensity level based on gifState
  const intensityLevel = 
    gifState.includes('_3') ? 3 :
    gifState.includes('_2') ? 2 : 1
  
  // Determine if it's a happy or sad variant
  const isHappyIntensity = gifState.includes('happy_idle') || gifState === 'idle'
  const isSadIntensity = gifState.includes('sad_idle')
  
  // Color schemes for intensity effects
  const intensityColors = {
    happy: {
      primary: 'rgba(34, 197, 94, ',      // Green
      secondary: 'rgba(16, 185, 129, ',   // Emerald
      accent: 'rgba(52, 211, 153, ',      // Light emerald
    },
    sad: {
      primary: 'rgba(239, 68, 68, ',      // Red
      secondary: 'rgba(220, 38, 38, ',    // Darker red
      accent: 'rgba(248, 113, 113, ',     // Light red
    },
    neutral: {
      primary: 'rgba(255, 255, 255, ',
      secondary: 'rgba(200, 200, 200, ',
      accent: 'rgba(180, 180, 180, ',
    }
  }
  
  const colorScheme = isSadIntensity ? intensityColors.sad : 
                      isHappyIntensity ? intensityColors.happy : 
                      intensityColors.neutral

  // Determine GIF path based on lifecycle stage
  let gifPath = `/gifs/${gifState}.gif`
  
  if (lifecycle.stage === "born") {
    gifPath = "/gifs/lifecycle/born.gif"
  } else if (lifecycle.stage === "dead") {
    gifPath = "/gifs/lifecycle/dead.gif"
  } else if (lifecycle.stage === "baby" || lifecycle.stage === "old") {
    const stage = lifecycle.stage
    let fileName = ""
    
    switch (gifState) {
      case "happy":
        fileName = "happy-speaking.gif"
        break
      case "sad":
        fileName = "sad-speaking.gif"
        break
      case "idle":
        fileName = "happy-idle.gif"
        break
      case "sad_idle":
        fileName = "sad-idle.gif"
        break
      case "slap":
        fileName = "slap.gif"
        break
      default:
        // Fallback for intensity states which shouldn't happen in baby/old
        fileName = gifState.includes("sad") ? "sad-idle.gif" : "happy-idle.gif"
    }
    
    gifPath = `/gifs/lifecycle/${stage}/${fileName}`
  }

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
        {/* === INTENSITY LEVEL 2 & 3 EFFECTS === */}
        
        {/* Pulsing Radial Rings - Level 2+ */}
        {intensityLevel >= 2 && (
          <>
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, transparent 30%, ${colorScheme.primary}0.08) 50%, transparent 70%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at 50% 50%, transparent 40%, ${colorScheme.secondary}0.06) 60%, transparent 80%)`,
              }}
              animate={{
                scale: [1.1, 1.3, 1.1],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />
          </>
        )}
        
        {/* Aurora Shimmer Effect - Level 2+ */}
        {intensityLevel >= 2 && (
          <motion.div
            className="absolute inset-0 pointer-events-none overflow-hidden"
            animate={{
              opacity: [0.15, 0.25, 0.15],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <motion.div
              className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2"
              style={{
                background: `conic-gradient(from 0deg at 50% 50%, 
                  transparent 0deg, 
                  ${colorScheme.primary}0.1) 30deg, 
                  transparent 60deg, 
                  ${colorScheme.accent}0.08) 120deg, 
                  transparent 180deg,
                  ${colorScheme.secondary}0.1) 240deg,
                  transparent 300deg,
                  ${colorScheme.primary}0.08) 330deg,
                  transparent 360deg
                )`,
              }}
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        )}
        
        {/* === INTENSITY LEVEL 3 EXTRA EFFECTS === */}
        
        {/* Breathing Halo - Level 3 Only */}
        {intensityLevel >= 3 && (
          <>
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: '60vmin',
                height: '60vmin',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${colorScheme.primary}0.15) 0%, transparent 70%)`,
                filter: 'blur(40px)',
              }}
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 0.7, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Secondary Halo */}
            <motion.div
              className="absolute pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                width: '80vmin',
                height: '80vmin',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                border: `2px solid ${colorScheme.primary}0.2)`,
                boxShadow: `0 0 30px ${colorScheme.primary}0.3), inset 0 0 30px ${colorScheme.primary}0.1)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
          </>
        )}
        
        {/* Floating Particle Orbs - Level 3 Only */}
        {intensityLevel >= 3 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${15 + i * 5}px`,
                  height: `${15 + i * 5}px`,
                  background: `radial-gradient(circle, ${colorScheme.accent}0.4) 0%, transparent 70%)`,
                  filter: 'blur(3px)',
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  x: [0, (i % 2 === 0 ? 20 : -20), 0],
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        )}
        
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

      {/* GIF Display - Full Screen, Centered - Clickable */}
      <div 
        ref={otterContainerRef}
        className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
        onClick={handleOtterClick}
      >
        {/* 
          Fixed SQUARE container to match original GIF dimensions (1080x1080).
          New GIFs are 960x1280 (taller), so we force them into a square 
          container to match the original sizing.
        */}
        <div 
          className="relative flex items-center justify-center pointer-events-none overflow-hidden"
          style={{
            width: "min(80vw, 80vh, 450px)",
            height: "min(80vw, 80vh, 450px)",
            aspectRatio: "1 / 1",
          }}
        >
          {/* Previous GIF - fading out */}
          {previousGifState && previousGifState !== gifState && (
            <motion.img
              key={`prev-${previousGifState}`}
              src={`/gifs/${previousGifState}.gif`}
              alt={`Otter ${previousGifState}`}
              className="absolute object-contain"
              style={{
                imageRendering: "auto",
                width: "100%",
                height: "100%",
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
            className="absolute object-contain"
            style={{
              imageRendering: "auto",
              width: "100%",
              height: "100%",
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
      <div className="absolute top-14 right-2 md:top-6 md:right-6 z-20">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/50 backdrop-blur-md rounded-xl md:rounded-2xl p-2.5 md:p-4 border border-white/10 shadow-xl"
        >
          {/* Interval Selector */}
          <div className="flex gap-0.5 md:gap-1 justify-center bg-black/30 p-0.5 md:p-1 rounded-lg md:rounded-xl mb-2 md:mb-3">
            {(["m5", "h1", "h24"] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => onIntervalChange(interval)}
                className={`px-2.5 py-1 md:px-3 md:py-1.5 rounded-md md:rounded-lg text-[11px] md:text-xs font-bold transition-all ${
                  selectedInterval === interval
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {interval === "m5" ? "5M" : interval === "h1" ? "1H" : "24H"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <div>
              <p className="text-white/60 text-[9px] md:text-xs uppercase tracking-wider mb-0.5">$DEGEN</p>
              <p className="text-white text-base md:text-2xl font-bold">
                ${priceData.price > 0 ? priceData.price.toFixed(6) : "0.000000"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[9px] md:text-xs uppercase tracking-wider mb-0.5">
                {selectedInterval === "m5" ? "5M" : selectedInterval === "h1" ? "1H" : "24H"}
              </p>
              <p className={`text-sm md:text-lg font-semibold ${
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

      {/* Birth phase: loading bar + witty messages */}
      {lifecycle.stage === "born" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-6 px-6"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p className="text-white/90 text-center text-lg md:text-xl font-medium max-w-md">
            {BIRTH_LOADING_MESSAGES[birthMessageIndex]}
          </p>
          <div className="w-full max-w-sm md:max-w-md">
            <div
              className="h-2 rounded-full overflow-hidden bg-white/20 border border-white/20"
              role="progressbar"
              aria-valuenow={Math.round(birthProgress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                style={{ width: `${birthProgress * 100}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-white/50 text-center text-sm mt-2">
              {Math.round(birthProgress * 100)}%
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

