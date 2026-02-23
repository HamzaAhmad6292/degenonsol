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
  /** BTC/ETH layer state for wind and fog overlays */
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
      {/* Background — trend tint (red/green/neutral) blends into same neutral base as navbar */}
      <div 
        className="absolute inset-0 transition-all duration-1000 ease-in-out z-0"
        style={{
          background: `linear-gradient(135deg, ${
            trend === "up"
              ? "rgba(34, 197, 94, 0.18)"
              : trend === "down"
              ? "rgba(239, 68, 68, 0.2)"
              : "rgba(255, 255, 255, 0.06)"
          } 0%, var(--chat-page-bg) 100%)`,
          boxShadow: `0 0 80px ${glowColor}`,
        }}
      >
        {/* Forest background — silhouettes and ground so it doesn't feel empty */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Ground / horizon gradient */}
          <div
            className="absolute inset-x-0 bottom-0 h-[55%]"
            style={{
              background: "linear-gradient(to top, rgba(15, 35, 25, 0.5) 0%, rgba(20, 45, 35, 0.2) 25%, transparent 70%)",
            }}
          />
          {/* Back layer — distant pines (small, faint) */}
          {[
            { left: "2%", width: "18%", height: "35%", opacity: 0.22 },
            { left: "22%", width: "14%", height: "28%", opacity: 0.18 },
            { left: "45%", width: "20%", height: "38%", opacity: 0.2 },
            { left: "68%", width: "16%", height: "32%", opacity: 0.19 },
            { left: "85%", width: "15%", height: "30%", opacity: 0.21 },
          ].map((t, i) => (
            <div
              key={`pine-b-${i}`}
              className="absolute bottom-0"
              style={{
                left: t.left,
                width: t.width,
                height: t.height,
                opacity: t.opacity,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                background: "linear-gradient(180deg, rgba(10, 30, 22, 0.9) 0%, rgba(8, 22, 16, 0.95) 100%)",
              }}
            />
          ))}
          {/* Mid layer — taller pines */}
          {[
            { left: "8%", width: "22%", height: "48%", opacity: 0.28 },
            { left: "35%", width: "18%", height: "42%", opacity: 0.25 },
            { left: "58%", width: "24%", height: "52%", opacity: 0.26 },
            { left: "78%", width: "20%", height: "45%", opacity: 0.27 },
          ].map((t, i) => (
            <div
              key={`pine-m-${i}`}
              className="absolute bottom-0"
              style={{
                left: t.left,
                width: t.width,
                height: t.height,
                opacity: t.opacity,
                clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                background: "linear-gradient(180deg, rgba(12, 28, 20, 0.85) 0%, rgba(6, 18, 12, 0.9) 100%)",
              }}
            />
          ))}
          {/* Front layer — round foliage blobs for depth */}
          {[
            { left: "-5%", width: "28%", height: "22%", opacity: 0.2 },
            { left: "25%", width: "20%", height: "18%", opacity: 0.18 },
            { left: "52%", width: "26%", height: "24%", opacity: 0.22 },
            { left: "82%", width: "24%", height: "20%", opacity: 0.19 },
          ].map((t, i) => (
            <div
              key={`blob-${i}`}
              className="absolute bottom-0 rounded-full"
              style={{
                left: t.left,
                width: t.width,
                height: t.height,
                opacity: t.opacity,
                background: "radial-gradient(ellipse 100% 100% at 50% 100%, rgba(18, 40, 28, 0.9) 0%, rgba(10, 25, 18, 0.7) 100%)",
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
          const tier = getIntensityTier(priceChangePercent)
          const sunriseOpacity = tier === 3 ? 0.85 : tier === 2 ? 0.6 : 0.35
          const sunScale = tier === 3 ? 1 : tier === 2 ? 0.75 : 0.5
          const showFlowers = tier >= 2
          const flowerCount = tier === 3 ? 14 : 7
          return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Sunrise gradient — horizon glow, warm orange → pink → transparent */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: sunriseOpacity,
                  background: `
                    radial-gradient(ellipse 140% 90% at 50% 85%, rgba(255, 180, 100, 0.4) 0%, rgba(255, 140, 120, 0.25) 25%, rgba(255, 200, 180, 0.08) 50%, transparent 70%),
                    linear-gradient(to top, rgba(255, 200, 150, 0.2) 0%, transparent 45%)
                  `,
                }}
              />
              {/* Sun disc — soft glow, subtle pulse at higher intensity */}
              <div
                className="absolute left-1/2 top-[18%] -translate-x-1/2 rounded-full"
                style={{
                  width: `${Math.min(22, 14 + tier * 4)}vw`,
                  height: `${Math.min(22, 14 + tier * 4)}vw`,
                  transform: `translate(-50%, 0) scale(${sunScale})`,
                  background: "radial-gradient(circle at 30% 30%, rgba(255, 250, 220, 0.95) 0%, rgba(255, 230, 160, 0.9) 40%, rgba(255, 200, 100, 0.5) 70%, rgba(255, 180, 80, 0.2) 100%)",
                  boxShadow: "0 0 80px 30px rgba(255, 200, 100, 0.4), 0 0 120px 50px rgba(255, 180, 80, 0.2)",
                  animation: tier >= 2 ? "sunrise-sun-pulse 4s ease-in-out infinite" : undefined,
                }}
              />
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

        {/* Weather: fog / temperature (ETH) — drifting mist + breathing + optional strip */}
        {weatherLayers?.eth && (() => {
          const isWarm = weatherLayers.eth.trend === "up"
          const isCold = weatherLayers.eth.trend === "down"
          const fogOpacity = Math.max(0.5, Math.min(0.85, 0.5 + Math.abs(weatherLayers.eth.priceChangePercent) / 60))
          const patches = [
            { size: "120vw 40vh", left: "5%", top: "10%", blur: 65, color: isWarm ? "rgba(255,200,120,0.25)" : isCold ? "rgba(140,180,255,0.22)" : "rgba(220,220,240,0.12)", anim: "fog-drift", dur: "25s", delay: "0s" },
            { size: "80vw 35vh", left: "40%", top: "50%", blur: 55, color: isWarm ? "rgba(255,190,100,0.2)" : isCold ? "rgba(120,160,230,0.2)" : "rgba(200,210,230,0.1)", anim: "fog-drift-slow", dur: "32s", delay: "-8s" },
            { size: "100vw 45vh", left: "60%", top: "20%", blur: 70, color: isWarm ? "rgba(255,210,130,0.18)" : isCold ? "rgba(100,150,220,0.18)" : "rgba(210,215,230,0.08)", anim: "fog-drift", dur: "28s", delay: "-15s" },
            { size: "70vw 30vh", left: "15%", top: "60%", blur: 50, color: isWarm ? "rgba(255,180,90,0.22)" : isCold ? "rgba(130,170,240,0.2)" : "rgba(205,208,225,0.1)", anim: "fog-drift-slow", dur: "30s", delay: "-4s" },
          ]
          return (
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
              {/* Base temperature glow — warm amber or cold blue */}
              <div
                className="absolute inset-0"
                style={{
                  background: isWarm
                    ? "radial-gradient(ellipse 120% 80% at 30% 20%, rgba(255,180,80,0.35) 0%, transparent 55%)"
                    : isCold
                      ? "radial-gradient(ellipse 100% 90% at 70% 80%, rgba(100,150,220,0.3) 0%, transparent 50%)"
                      : "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(200,200,220,0.12) 0%, transparent 60%)",
                  animation: isWarm ? "temp-glow-warm 6s ease-in-out infinite" : isCold ? "temp-glow-cold 8s ease-in-out infinite" : "none",
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
                      background: isWarm
                        ? "linear-gradient(180deg, transparent 0%, rgba(255,200,120,0.15) 40%, rgba(255,180,80,0.12) 100%)"
                        : isCold
                          ? "linear-gradient(180deg, transparent 0%, rgba(140,180,255,0.12) 40%, rgba(100,150,220,0.1) 100%)"
                          : "linear-gradient(180deg, transparent 0%, rgba(220,220,240,0.08) 100%)",
                      filter: "blur(40px)",
                    }}
                  />
                  <div
                    className="w-1/2 h-full shrink-0 rounded-[50%]"
                    style={{
                      background: isWarm
                        ? "linear-gradient(180deg, transparent 0%, rgba(255,200,120,0.15) 40%, rgba(255,180,80,0.12) 100%)"
                        : isCold
                          ? "linear-gradient(180deg, transparent 0%, rgba(140,180,255,0.12) 40%, rgba(100,150,220,0.1) 100%)"
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
      <div className="absolute top-6 right-2 md:top-6 md:right-6 z-[80] flex flex-col items-end gap-1.5 md:gap-2">
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
        {(weatherLayers?.btc || weatherLayers?.eth) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md rounded-lg px-1.5 py-1 md:px-2.5 md:py-1.5 border border-white/10 flex flex-col gap-0.5 text-[8px] md:text-xs max-w-[140px] md:max-w-none"
          >
            <p className="text-white/40 text-[8px] md:text-[10px] uppercase tracking-wider mb-0.5 leading-tight">
              Wind=BTC 24h · Fog=ETH 24h
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
              {weatherLayers?.eth && (
                <span className="text-white/90 text-[8px] md:text-xs">
                  <span className="text-white/60 mr-0.5">ETH</span>
                  <span className={weatherLayers.eth.trend === "up" ? "text-amber-400" : weatherLayers.eth.trend === "down" ? "text-sky-400" : "text-white/60"}>
                    {weatherLayers.eth.trend === "up" ? "↑" : weatherLayers.eth.trend === "down" ? "↓" : "→"} {weatherLayers.eth.priceChangePercent.toFixed(1)}%
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

