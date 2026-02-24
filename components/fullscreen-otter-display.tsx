"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { motion } from "framer-motion"
import { TokenLineChart } from "./token-line-chart"
import { type TokenPrice } from "./token-price-fetcher"
import { type GifState, type OneShotGif } from "@/app/chat/page"
import { type LifecycleInfo, STAGE_DURATIONS } from "@/lib/lifecycle"
import type { WeatherLayersState } from "@/lib/weather-types"

interface PricePoint {
  price: number
  time: number
}

/** Price-change intensity tiers — must match getIdleIntensity() in app/chat/page.tsx */
export const PRICE_INTENSITY = {
  /** Low: idle / sad_idle — below this is "neutral" for glow */
  LOW_PERCENT: 2,
  /** High: happy_idle_3 / sad_idle_3 — ≥ this is max intensity */
  HIGH_PERCENT: 3,
} as const

/** Returns 1 (low), 2 (medium), or 3 (high) from |priceChangePercent| using same thresholds as GIF states */
function getIntensityTier(priceChangePercent: number): 1 | 2 | 3 {
  const abs = Math.abs(priceChangePercent)
  if (abs >= PRICE_INTENSITY.HIGH_PERCENT) return 3
  if (abs >= PRICE_INTENSITY.LOW_PERCENT) return 2
  return 1
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
  /** BTC atmospheric layer state for wind + sky/fog overlays */
  weatherLayers?: WeatherLayersState
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
  lifecycle,
  weatherLayers,
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

  const selectedIntervalLabel =
    selectedInterval === "m5" ? "5M" : selectedInterval === "h1" ? "1H" : "24H"

  const intensityTier = getIntensityTier(priceChangePercent)
  const macroSkyTrend = weatherLayers?.btc?.trend ?? trend
  const skyPreset =
    macroSkyTrend === "down"
      ? {
          top: "rgb(18, 28, 48)",
          mid: "rgb(52, 78, 112)",
          horizon: "rgb(156, 176, 194)",
          low: "rgb(84, 98, 108)",
          cloud: "rgba(210, 220, 235, 0.22)",
          haze: "rgba(210, 225, 255, 0.12)",
        }
      : macroSkyTrend === "up"
        ? {
            top: "rgb(38, 108, 255)",
            mid: "rgb(118, 214, 255)",
            horizon: "rgb(255, 228, 184)",
            low: "rgb(200, 238, 255)",
            cloud: "rgba(255, 255, 255, 0.28)",
            haze: "rgba(255, 255, 255, 0.14)",
          }
        : {
            top: "rgb(40, 120, 255)",
            mid: "rgb(128, 224, 255)",
            horizon: "rgb(235, 245, 255)",
            low: "rgb(190, 235, 255)",
            cloud: "rgba(255, 255, 255, 0.22)",
            haze: "rgba(255, 255, 255, 0.1)",
          }

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
      {/* Background — real sky base + subtle trend tint; keeps chart readable */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
        style={{
          background: `
            radial-gradient(ellipse 90% 55% at 50% 12%, ${
              macroSkyTrend === "up"
                ? "rgba(255, 210, 140, 0.45)"
                : macroSkyTrend === "down"
                  ? "rgba(110, 130, 160, 0.25)"
                  : "rgba(255, 255, 255, 0.18)"
            } 0%, transparent 60%),
            radial-gradient(ellipse 140% 80% at 50% -10%, ${skyPreset.haze} 0%, transparent 70%),
            linear-gradient(to bottom, ${skyPreset.top} 0%, ${skyPreset.mid} 42%, ${skyPreset.horizon} 72%, ${skyPreset.low} 100%)
          `,
          boxShadow: `0 0 70px ${glowColor}`,
        }}
      >
        {/* Sky cloud haze — subtle drift so the background feels alive */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -inset-[35%]"
            style={{
              opacity: macroSkyTrend === "down" ? 0.42 : 0.34,
              background: `
                radial-gradient(ellipse 30% 16% at 18% 22%, ${skyPreset.cloud} 0%, transparent 62%),
                radial-gradient(ellipse 34% 18% at 70% 16%, ${skyPreset.cloud} 0%, transparent 64%),
                radial-gradient(ellipse 42% 20% at 46% 30%, ${skyPreset.cloud} 0%, transparent 66%),
                radial-gradient(ellipse 36% 18% at 82% 34%, ${skyPreset.cloud} 0%, transparent 68%),
                radial-gradient(ellipse 40% 18% at 10% 38%, ${skyPreset.cloud} 0%, transparent 70%)
              `,
              filter: "blur(26px)",
              willChange: "transform",
              animation: "sky-cloud-drift 58s ease-in-out infinite",
            }}
          />
        </div>

        {/* Forest background — silhouettes and ground so it doesn't feel empty */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Ground / horizon gradient */}
          <div
            className="absolute inset-x-0 bottom-0 h-[55%]"
            style={{
              background: "linear-gradient(to top, rgba(15, 35, 25, 0.5) 0%, rgba(20, 45, 35, 0.2) 25%, transparent 70%)",
            }}
          />
          {/* Distant tree-line haze to avoid mountain look */}
          <div
            className="absolute inset-x-0 bottom-[16%] h-[18%]"
            style={{
              background:
                "radial-gradient(ellipse 120% 90% at 50% 100%, rgba(14, 36, 24, 0.42) 0%, rgba(10, 25, 18, 0.24) 54%, transparent 78%)",
              filter: "blur(3px)",
            }}
          />
          {/* Back layer — smaller conifer clusters */}
          {[
            { left: "2%", canopy: 4.8, height: 32, opacity: 0.28 },
            { left: "13%", canopy: 4.1, height: 28, opacity: 0.24 },
            { left: "25%", canopy: 4.6, height: 31, opacity: 0.26 },
            { left: "39%", canopy: 4.3, height: 29, opacity: 0.25 },
            { left: "52%", canopy: 5, height: 33, opacity: 0.27 },
            { left: "67%", canopy: 4.2, height: 30, opacity: 0.24 },
            { left: "80%", canopy: 4.7, height: 32, opacity: 0.26 },
            { left: "91%", canopy: 4.1, height: 28, opacity: 0.23 },
          ].map((tree, i) => (
            <div
              key={`tree-back-${i}`}
              className="absolute bottom-[12%]"
              style={{
                left: tree.left,
                width: `clamp(22px, ${tree.canopy}vw, 62px)`,
                height: `clamp(84px, ${tree.height}vh, 185px)`,
                opacity: tree.opacity,
              }}
            >
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-sm"
                style={{
                  width: "clamp(3px, 0.45vw, 7px)",
                  height: "28%",
                  background: "linear-gradient(180deg, rgba(36, 27, 18, 0.65) 0%, rgba(22, 16, 10, 0.82) 100%)",
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  bottom: "22%",
                  width: "100%",
                  height: "33%",
                  background:
                    "radial-gradient(ellipse 85% 70% at 50% 70%, rgba(16, 44, 30, 0.95) 0%, rgba(8, 24, 17, 0.9) 100%)",
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  bottom: "44%",
                  width: "82%",
                  height: "29%",
                  background:
                    "radial-gradient(ellipse 85% 70% at 50% 70%, rgba(17, 48, 32, 0.9) 0%, rgba(9, 26, 18, 0.88) 100%)",
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  bottom: "65%",
                  width: "63%",
                  height: "25%",
                  background:
                    "radial-gradient(ellipse 85% 70% at 50% 75%, rgba(20, 54, 36, 0.82) 0%, rgba(10, 29, 20, 0.84) 100%)",
                }}
              />
            </div>
          ))}
          {/* Mid layer — broader canopy trees */}
          {[
            { left: "-2%", canopy: 7.8, height: 40, opacity: 0.34 },
            { left: "10%", canopy: 6.9, height: 38, opacity: 0.31 },
            { left: "24%", canopy: 8.3, height: 42, opacity: 0.35 },
            { left: "39%", canopy: 7.1, height: 39, opacity: 0.32 },
            { left: "55%", canopy: 8.8, height: 43, opacity: 0.36 },
            { left: "72%", canopy: 7.5, height: 40, opacity: 0.33 },
            { left: "87%", canopy: 7.9, height: 41, opacity: 0.34 },
          ].map((tree, i) => (
            <div
              key={`tree-mid-${i}`}
              className="absolute bottom-[4%]"
              style={{
                left: tree.left,
                width: `clamp(36px, ${tree.canopy}vw, 105px)`,
                height: `clamp(108px, ${tree.height}vh, 235px)`,
                opacity: tree.opacity,
              }}
            >
              <div
                className="absolute left-1/2 bottom-0 -translate-x-1/2 rounded-sm"
                style={{
                  width: "clamp(4px, 0.6vw, 10px)",
                  height: "26%",
                  background: "linear-gradient(180deg, rgba(45, 34, 22, 0.75) 0%, rgba(22, 16, 11, 0.9) 100%)",
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  bottom: "20%",
                  width: "100%",
                  height: "35%",
                  background:
                    "radial-gradient(ellipse 90% 75% at 50% 72%, rgba(18, 52, 34, 0.95) 0%, rgba(10, 30, 21, 0.92) 100%)",
                }}
              />
              <div
                className="absolute left-[44%] -translate-x-1/2 rounded-full"
                style={{
                  bottom: "45%",
                  width: "72%",
                  height: "30%",
                  background:
                    "radial-gradient(ellipse 88% 70% at 50% 72%, rgba(22, 58, 39, 0.92) 0%, rgba(11, 33, 23, 0.9) 100%)",
                }}
              />
              <div
                className="absolute left-[58%] -translate-x-1/2 rounded-full"
                style={{
                  bottom: "47%",
                  width: "68%",
                  height: "28%",
                  background:
                    "radial-gradient(ellipse 88% 70% at 50% 72%, rgba(20, 55, 37, 0.9) 0%, rgba(10, 31, 22, 0.88) 100%)",
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{
                  bottom: "66%",
                  width: "56%",
                  height: "22%",
                  background:
                    "radial-gradient(ellipse 84% 68% at 50% 75%, rgba(26, 65, 44, 0.84) 0%, rgba(12, 35, 24, 0.86) 100%)",
                }}
              />
            </div>
          ))}
          {/* Front shrubs for depth and stronger forest floor */}
          {[
            { left: "-8%", width: 26, height: 18, opacity: 0.28 },
            { left: "14%", width: 22, height: 16, opacity: 0.24 },
            { left: "36%", width: 27, height: 18, opacity: 0.3 },
            { left: "60%", width: 24, height: 17, opacity: 0.27 },
            { left: "82%", width: 28, height: 19, opacity: 0.29 },
          ].map((shrub, i) => (
            <div
              key={`shrub-${i}`}
              className="absolute bottom-0 rounded-full"
              style={{
                left: shrub.left,
                width: `clamp(120px, ${shrub.width}vw, 420px)`,
                height: `clamp(64px, ${shrub.height}vh, 180px)`,
                opacity: shrub.opacity,
                background:
                  "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(17, 44, 30, 0.9) 0%, rgba(10, 27, 19, 0.76) 100%)",
                filter: "blur(0.3px)",
              }}
            />
          ))}
        </div>

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

        {/* Rain when token is dumping — intensity by same tiers as sad_idle / sad_idle_2 / sad_idle_3 */}
        {trend === "down" && (() => {
          const tier = getIntensityTier(priceChangePercent)
          const count = tier === 3 ? 55 : tier === 2 ? 38 : 22
          const duration = tier === 3 ? 0.65 : tier === 2 ? 0.9 : 1.4
          const layerOpacity = tier === 3 ? 0.72 : tier === 2 ? 0.55 : 0.4
          return (
            <div
              className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
              style={{ opacity: layerOpacity, willChange: "transform" }}
            >
              {Array.from({ length: count }, (_, i) => (
                <div
                  key={`rain-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: tier === 3 ? 2.5 : 2,
                    height: tier === 3 ? 18 + (i % 6) : tier === 2 ? 16 + (i % 5) : 14 + (i % 5),
                    left: `${(i * 6.1 + 1) % 100}%`,
                    top: "-2%",
                    background: "rgba(200, 220, 255, 0.85)",
                    boxShadow: "0 0 4px rgba(255,255,255,0.3)",
                    transform: "rotate(-14deg)",
                    animation: "rain-fall linear infinite",
                    animationDuration: `${duration + (i % 5) * 0.1}s`,
                    animationDelay: `-${(i * 0.18) % (duration + 0.6)}s`,
                  }}
                />
              ))}
            </div>
          )
        })()}

        {/* Sunrise + sun when token is rising — intensity by same tiers as idle / happy_idle_2 / happy_idle_3 */}
        {trend === "up" && (() => {
          const sunriseOpacity = intensityTier === 3 ? 0.8 : intensityTier === 2 ? 0.6 : 0.42
          const sunScale = intensityTier === 3 ? 1 : intensityTier === 2 ? 0.82 : 0.65
          const showFlowers = intensityTier >= 2
          const flowerCount = intensityTier === 3 ? 14 : 7
          return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Sunrise gradient — horizon glow, warm orange → pink → transparent */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: sunriseOpacity,
                  background: `
                    radial-gradient(ellipse 160% 95% at 50% 88%, rgba(255, 190, 120, 0.45) 0%, rgba(255, 150, 120, 0.26) 22%, rgba(255, 220, 200, 0.1) 48%, transparent 72%),
                    radial-gradient(ellipse 90% 55% at 50% 20%, rgba(255, 240, 210, 0.12) 0%, transparent 55%),
                    linear-gradient(to top, rgba(255, 210, 160, 0.18) 0%, transparent 46%)
                  `,
                }}
              />
              {/* Sun — bright warm disc + corona + subtle rays (so it reads as sun, not moon) */}
              <div
                className="absolute left-1/2 top-[12%] -translate-x-1/2"
                style={{
                  width: `${Math.min(26, 16 + intensityTier * 4)}vw`,
                  height: `${Math.min(26, 16 + intensityTier * 4)}vw`,
                  transform: `translate(-50%, 0) scale(${sunScale})`,
                }}
              >
                {/* Rays */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: "-35%",
                    opacity: intensityTier === 3 ? 0.38 : intensityTier === 2 ? 0.26 : 0.18,
                    background:
                      "repeating-conic-gradient(from 0deg, rgba(255, 200, 90, 0.55) 0deg 10deg, rgba(255, 180, 70, 0) 10deg 22deg)",
                    maskImage: "radial-gradient(circle, transparent 0% 38%, rgba(0,0,0,1) 55%, transparent 72%)",
                    WebkitMaskImage:
                      "radial-gradient(circle, transparent 0% 38%, rgba(0,0,0,1) 55%, transparent 72%)",
                    filter: "blur(0.6px)",
                    willChange: "transform",
                    animation:
                      intensityTier >= 2 ? "sun-rays-rotate 26s linear infinite" : "sun-rays-rotate 34s linear infinite",
                  }}
                />
                {/* Outer glow */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: "-22%",
                    background:
                      "radial-gradient(circle, rgba(255, 240, 200, 0.55) 0%, rgba(255, 195, 95, 0.34) 40%, rgba(255, 170, 70, 0.12) 70%, transparent 78%)",
                    filter: "blur(10px)",
                    animation: intensityTier >= 2 ? "sunrise-sun-pulse 4s ease-in-out infinite" : undefined,
                  }}
                />
                {/* Disc */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `
                      radial-gradient(circle at 34% 32%, rgba(255, 255, 245, 0.98) 0%, rgba(255, 245, 210, 0.95) 28%, rgba(255, 210, 120, 0.9) 55%, rgba(255, 170, 65, 0.75) 80%, rgba(255, 145, 55, 0.6) 100%),
                      radial-gradient(circle at 65% 70%, rgba(255, 255, 255, 0.14) 0%, transparent 55%)
                    `,
                    boxShadow:
                      "0 0 90px 28px rgba(255, 200, 100, 0.42), 0 0 160px 60px rgba(255, 165, 70, 0.22)",
                  }}
                />
                {/* Core highlight */}
                <div
                  className="absolute rounded-full"
                  style={{
                    inset: "18%",
                    background:
                      "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 245, 210, 0.35) 55%, transparent 72%)",
                    opacity: intensityTier === 3 ? 0.95 : 0.85,
                    filter: "blur(0.5px)",
                  }}
                />
              </div>
              {/* Flowers / petals — tier 2: few; tier 3: more, gentle float */}
              {showFlowers &&
                Array.from({ length: flowerCount }, (_, i) => {
                  const size = 8 + (i % 4)
                  const left = `${(i * 13 + 7) % 92}%`
                  const bottom = `${(i * 11 + 5) % 35}%`
                  const delay = (i * 0.4) % 3
                  const duration = 5 + (i % 3)
                  return (
                    <div
                      key={`flower-${i}`}
                      className="absolute rounded-full"
                      style={{
                        width: size,
                        height: size,
                        left,
                        bottom,
                        background: i % 3 === 0
                          ? "radial-gradient(circle at 30% 30%, rgba(255, 220, 180, 0.9) 0%, rgba(255, 180, 120, 0.7) 100%)"
                          : i % 3 === 1
                            ? "radial-gradient(circle at 30% 30%, rgba(255, 200, 220, 0.85) 0%, rgba(255, 150, 180, 0.65) 100%)"
                            : "radial-gradient(circle at 30% 30%, rgba(255, 240, 200, 0.9) 0%, rgba(255, 210, 150, 0.7) 100%)",
                        boxShadow: "0 0 6px rgba(255,200,150,0.4)",
                        animation: "flower-float ease-in-out infinite",
                        animationDuration: `${duration}s`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  )
                })}
            </div>
          )
        })()}

        {/* Weather: wind (BTC) — flying leaves with depth tiers and leaf shape */}
        {weatherLayers?.btc && (() => {
          const intensity = Math.max(0.4, Math.min(0.9, 0.4 + Math.abs(weatherLayers.btc.priceChangePercent) / 80))
          const baseSpeed = Math.max(8, 18 - Math.abs(weatherLayers.btc.priceChangePercent) * 0.3)
          const depthTiers: { count: number; durationRange: [number, number]; opacityMul: number }[] = [
            { count: 5, durationRange: [18, 22], opacityMul: 0.55 },
            { count: 6, durationRange: [14, 17], opacityMul: 0.8 },
            { count: 5, durationRange: [10, 14], opacityMul: 1 },
          ]
          let idx = 0
          return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden" style={{ opacity: intensity }}>
              {depthTiers.flatMap((tier, tierIndex) =>
                Array.from({ length: tier.count }, (_, i) => {
                  const leafIdx = idx++
                  const duration = tier.durationRange[0] + (leafIdx % (tier.durationRange[1] - tier.durationRange[0] + 1))
                  const baseOpacity = (tier.opacityMul * (leafIdx % 3 === 0 ? 0.7 : leafIdx % 3 === 1 ? 0.6 : 0.65))
                  return (
                    <div
                      key={`wind-${tierIndex}-${i}`}
                      className="absolute"
                      style={{
                        width: 8 + (leafIdx % 4),
                        height: 14 + (leafIdx % 3),
                        left: 0,
                        top: `${(leafIdx * 7 + 11) % 92}%`,
                        borderRadius: "5% 40% 70% 30%",
                        background:
                          leafIdx % 3 === 0
                            ? `linear-gradient(135deg, rgba(160,140,100,${baseOpacity}) 0%, rgba(180,160,120,${baseOpacity * 0.9}) 50%, rgba(160,140,100,${baseOpacity}) 100%)`
                            : leafIdx % 3 === 1
                              ? `linear-gradient(135deg, rgba(190,170,130,${baseOpacity}) 0%, rgba(200,180,140,${baseOpacity * 0.9}) 50%, rgba(190,170,130,${baseOpacity}) 100%)`
                              : `linear-gradient(135deg, rgba(150,130,90,${baseOpacity}) 0%, rgba(160,140,100,${baseOpacity * 0.9}) 50%, rgba(150,130,90,${baseOpacity}) 100%)`,
                        boxShadow: "0 0 6px rgba(0,0,0,0.15)",
                        willChange: "transform",
                        animation: leafIdx % 2 === 0 ? "wind-leaf linear infinite" : "wind-leaf-alt linear infinite",
                        animationDuration: `${duration}s`,
                        animationDelay: `-${(leafIdx * 1.7) % (duration + 4)}s`,
                      }}
                    />
                  )
                })
              )}
            </div>
          )
        })()}

        {/* Weather: SOL local atmosphere — drifting fog + temperature tint */}
        {weatherLayers?.sol && (() => {
          const isClear = weatherLayers.sol.trend === "up"
          const isStormy = weatherLayers.sol.trend === "down"
          const fogOpacity = Math.max(0.45, Math.min(0.82, 0.45 + Math.abs(weatherLayers.sol.priceChangePercent) / 70))
          const patches = [
            { size: "120vw 40vh", left: "5%", top: "10%", blur: 65, color: isClear ? "rgba(255,225,170,0.2)" : isStormy ? "rgba(145,175,220,0.25)" : "rgba(220,230,245,0.13)", anim: "fog-drift", dur: "25s", delay: "0s" },
            { size: "80vw 35vh", left: "40%", top: "50%", blur: 55, color: isClear ? "rgba(255,210,145,0.16)" : isStormy ? "rgba(125,160,210,0.22)" : "rgba(205,215,235,0.11)", anim: "fog-drift-slow", dur: "32s", delay: "-8s" },
            { size: "100vw 45vh", left: "60%", top: "20%", blur: 70, color: isClear ? "rgba(255,232,185,0.15)" : isStormy ? "rgba(115,150,200,0.2)" : "rgba(215,220,238,0.09)", anim: "fog-drift", dur: "28s", delay: "-15s" },
            { size: "70vw 30vh", left: "15%", top: "60%", blur: 50, color: isClear ? "rgba(255,215,160,0.18)" : isStormy ? "rgba(135,170,218,0.22)" : "rgba(205,210,228,0.1)", anim: "fog-drift-slow", dur: "30s", delay: "-4s" },
          ]
          return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Base sky pulse — clear amber vs storm-blue atmosphere */}
              <div
                className="absolute inset-0"
                style={{
                  background: isClear
                    ? "radial-gradient(ellipse 120% 80% at 30% 20%, rgba(255,205,120,0.28) 0%, transparent 55%)"
                    : isStormy
                      ? "radial-gradient(ellipse 100% 90% at 70% 80%, rgba(105,150,215,0.28) 0%, transparent 50%)"
                      : "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(208,218,236,0.12) 0%, transparent 60%)",
                  animation: isClear ? "temp-glow-warm 6s ease-in-out infinite" : isStormy ? "temp-glow-cold 8s ease-in-out infinite" : "none",
                }}
              />
              {/* Seamless loop ground mist strip */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[35%] overflow-hidden"
                style={{ transform: "translateZ(0)", willChange: "transform" }}
              >
                <div
                  className="absolute inset-0 w-[200%] flex"
                  style={{
                    animation: "fog-strip-loop 18s linear infinite",
                  }}
                >
                  <div
                    className="w-1/2 h-full shrink-0 rounded-[50%]"
                    style={{
                      background: isClear
                        ? "linear-gradient(180deg, transparent 0%, rgba(255,214,145,0.13) 40%, rgba(255,194,120,0.11) 100%)"
                        : isStormy
                          ? "linear-gradient(180deg, transparent 0%, rgba(150,188,248,0.13) 40%, rgba(118,160,226,0.11) 100%)"
                          : "linear-gradient(180deg, transparent 0%, rgba(220,220,240,0.08) 100%)",
                      filter: "blur(40px)",
                    }}
                  />
                  <div
                    className="w-1/2 h-full shrink-0 rounded-[50%]"
                    style={{
                      background: isClear
                        ? "linear-gradient(180deg, transparent 0%, rgba(255,214,145,0.13) 40%, rgba(255,194,120,0.11) 100%)"
                        : isStormy
                          ? "linear-gradient(180deg, transparent 0%, rgba(150,188,248,0.13) 40%, rgba(118,160,226,0.11) 100%)"
                          : "linear-gradient(180deg, transparent 0%, rgba(220,220,240,0.08) 100%)",
                      filter: "blur(40px)",
                    }}
                  />
                </div>
              </div>
              {/* Drifting fog patches with breathing + GPU hints */}
              {patches.map((patch, i) => (
                <div
                  key={`fog-${i}`}
                  className="absolute rounded-[50%]"
                  style={{
                    opacity: fogOpacity,
                    width: patch.size.split(" ")[0],
                    height: patch.size.split(" ")[1],
                    left: patch.left,
                    top: patch.top,
                  }}
                >
                  <div
                    className="absolute inset-0 rounded-[50%]"
                    style={{
                      background: patch.color,
                      filter: `blur(${patch.blur}px)`,
                      transform: "translateZ(0)",
                      willChange: "transform",
                      animation: `${patch.anim} ${patch.dur} ease-in-out infinite, fog-breathe 15s ease-in-out infinite`,
                      animationDelay: `${patch.delay}, ${i * 2}s`,
                    }}
                  />
                </div>
              ))}
            </div>
          )
        })()}
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

      {/* Price Display - Top Right (smaller + higher on phone, higher z-index) */}
      <div className="absolute top-6 right-2 md:top-6 md:right-6 z-80 flex flex-col items-end gap-1.5 md:gap-2">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-black/50 backdrop-blur-md rounded-lg md:rounded-2xl p-1.5 md:p-4 border border-white/10 shadow-xl max-w-[140px] md:max-w-none"
        >
          {/* Interval Selector */}
          <div className="flex gap-0.5 md:gap-1 justify-center bg-black/30 p-0.5 md:p-1 rounded-md md:rounded-xl mb-1 md:mb-3">
            {(["m5", "h1", "h24"] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => onIntervalChange(interval)}
                className={`px-1.5 py-0.5 md:px-3 md:py-1.5 rounded md:rounded-lg text-[9px] md:text-xs font-bold transition-all ${
                  selectedInterval === interval
                    ? "bg-white text-black shadow-lg"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                {interval === "m5" ? "5M" : interval === "h1" ? "1H" : "24H"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 md:gap-4">
            <div className="min-w-0">
              <p className="text-white/60 text-[8px] md:text-xs uppercase tracking-wider mb-0.5">$DEGEN</p>
              <p className="text-white text-xs md:text-2xl font-bold truncate">
                ${priceData.price > 0 ? priceData.price.toFixed(6) : "0.000000"}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white/60 text-[8px] md:text-xs uppercase tracking-wider mb-0.5">
                {selectedInterval === "m5" ? "5M" : selectedInterval === "h1" ? "1H" : "24H"}
              </p>
              <p className={`text-[10px] md:text-lg font-semibold ${
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

        {/* Weather = market (same compact size + z as price card on phone) */}
        {(weatherLayers?.btc || weatherLayers?.sol) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 border border-white/10 flex flex-col gap-0.5 text-[8px] md:text-xs max-w-[140px] md:max-w-none"
          >
            <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider mb-0.5 leading-tight">
              Weather Layers ({selectedIntervalLabel})
            </p>
            <div className="flex flex-wrap gap-x-2 md:gap-x-3 gap-y-0.5">
              {weatherLayers?.btc && (
                <span className="text-white/90 text-[8px] md:text-xs">
                  <span className="text-white/60 mr-0.5">BTC</span>
                  <span className={weatherLayers.btc.trend === "up" ? "text-green-400" : weatherLayers.btc.trend === "down" ? "text-red-400" : "text-white/60"}>
                    {weatherLayers.btc.trend === "up" ? "↑" : weatherLayers.btc.trend === "down" ? "↓" : "→"} {weatherLayers.btc.priceChangePercent.toFixed(1)}%
                  </span>
                </span>
              )}
              {weatherLayers?.sol && (
                <span className="text-white/90 text-[8px] md:text-xs">
                  <span className="text-white/60 mr-0.5">SOL</span>
                  <span className={weatherLayers.sol.trend === "up" ? "text-amber-400" : weatherLayers.sol.trend === "down" ? "text-sky-400" : "text-white/60"}>
                    {weatherLayers.sol.trend === "up" ? "↑" : weatherLayers.sol.trend === "down" ? "↓" : "→"} {weatherLayers.sol.priceChangePercent.toFixed(1)}%
                  </span>
                </span>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Birth phase: loading bar + witty messages (z-50, positioned high so visible above chat) */}
      {lifecycle.stage === "born" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-start pt-16 sm:pt-20 md:pt-24 gap-6 px-6"
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
                className="h-full rounded-full bg-linear-to-r from-amber-400 to-amber-500"
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

