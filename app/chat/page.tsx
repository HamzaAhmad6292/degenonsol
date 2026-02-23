"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { FullscreenOtterDisplay } from "@/components/fullscreen-otter-display"
import { SideChatBubbles } from "@/components/side-chat-bubbles"
import { DraggableCamera } from "@/components/draggable-camera"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ArOtterView } from "@/components/ar-otter-view"
import { type Sentiment } from "@/lib/sentiment-analyzer"
import { useTokenPrice } from "@/components/token-price-fetcher"
import { useBtcEthPrices } from "@/hooks/use-btc-eth-prices"
import { buildWeatherSummary } from "@/lib/weather-summary"
import { getLifecycleStage, type LifecycleInfo } from "@/lib/lifecycle"
import { captureCurrentCameraFrame } from "@/lib/camera-frame"

export interface IdentityState {
  userId: string | null
  displayName: string | null
  conversationId: string | null
  isNewUser: boolean
  sessionReady: boolean
  recentMessages: { role: "user" | "assistant"; content: string; created_at?: string }[]
  greeting: string | null
}

// Extended GIF state type to include intensity levels and interactive GIFs
export type GifState = "happy" | "sad" | "idle" | "sad_idle" | "happy_idle_2" | "happy_idle_3" | "sad_idle_2" | "sad_idle_3" | "lower50" | "upper50" | "slap"

// GIFs that should play only once and return to previous state
export type OneShotGif = "lower50" | "upper50" | "slap"

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.76-.54-1.43-1.23-1.93-2.02V15.5c0 1.61-.46 3.23-1.53 4.43-1.14 1.32-2.86 2.1-4.58 2.06-1.93.03-3.85-.93-4.99-2.49-1.15-1.54-1.44-3.62-.81-5.39.54-1.62 1.92-2.95 3.55-3.43 1.05-.31 2.15-.32 3.23-.14V14.6c-.7-.2-1.48-.23-2.19-.06-1.02.23-1.93.94-2.34 1.91-.43 1.03-.36 2.27.24 3.2.6.93 1.64 1.51 2.73 1.48 1.14.04 2.25-.54 2.84-1.52.46-.75.65-1.64.63-2.51V.02z"></path>
  </svg>
)

// Helper function to determine idle GIF intensity based on price change percentage
function getIdleIntensity(priceChangePercent: number, isHappy: boolean): GifState {
  const absChange = Math.abs(priceChangePercent)
  
  if (absChange >= 3) {
    // High intensity: ≥ 3% movement
    return isHappy ? "happy_idle_3" : "sad_idle_3"
  } else if (absChange >= 2) {
    // Medium intensity: 2% to 3% movement
    return isHappy ? "happy_idle_2" : "sad_idle_2"
  } else {
    // Low intensity: < 2% movement (default idle)
    return isHappy ? "idle" : "sad_idle"
  }
}

// Approximate duration of one-shot GIFs in milliseconds
const ONE_SHOT_GIF_DURATION = 2000 // Adjust based on actual GIF length

export default function ChatPage() {
  const [chatSentiment, setChatSentiment] = useState<Sentiment | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [serverStartTime, setServerStartTime] = useState<number>(Date.now())
  // Lifecycle is time-of-day (user's local); avoid SSR using server UTC — set from client on mount
  const [lifecycle, setLifecycle] = useState<LifecycleInfo>(() => ({
    stage: "adult" as const,
    canInteract: true,
    nextStageIn: 0,
  }))
  const serverStartTimeRef = useRef<number>(Date.now())
  serverStartTimeRef.current = serverStartTime

  // Lifted state for price and mood
  const { priceData } = useTokenPrice(5000)
  const { layers: weatherLayers } = useBtcEthPrices(10_000)
  const [gifState, setGifState] = useState<GifState>("idle")
  const [selectedInterval, setSelectedInterval] = useState<"m5" | "h1" | "h24">("m5")

  // State for one-shot GIF playback
  const [oneShotGif, setOneShotGif] = useState<OneShotGif | null>(null)
  const [previousGifState, setPreviousGifState] = useState<GifState>("idle")
  const [arOpen, setArOpen] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [faceServiceUnavailable, setFaceServiceUnavailable] = useState(false)

  const [identity, setIdentity] = useState<IdentityState>({
    userId: null,
    displayName: null,
    conversationId: null,
    isNewUser: false,
    sessionReady: false,
    recentMessages: [],
    greeting: null,
  })
  const faceSessionStartedRef = useRef(false)

  // When camera is on, try face session: retry capture a few times (video may not be ready immediately)
  useEffect(() => {
    if (!cameraOpen || identity.sessionReady || faceSessionStartedRef.current) return
    setFaceServiceUnavailable(false)
    const delays = [1500, 2500, 3500, 4500]
    const timeouts: ReturnType<typeof setTimeout>[] = []
    let attemptInProgress = false
    const runAttempt = async () => {
      if (attemptInProgress) return
      attemptInProgress = true
      const frame = await captureCurrentCameraFrame()
      if (!frame) {
        attemptInProgress = false
        return
      }
      faceSessionStartedRef.current = true
      timeouts.forEach(clearTimeout)
      try {
        const res = await fetch("/api/face/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ frameData: frame }),
        })
        const data = await res.json()
        if (data.status === "face_service_unavailable") {
          setFaceServiceUnavailable(true)
          return
        }
        if (data.status === "no_face" || !data.userId) return
        setIdentity({
          userId: data.userId,
          displayName: data.displayName ?? null,
          conversationId: data.conversationId,
          isNewUser: data.isNewUser ?? false,
          sessionReady: true,
          recentMessages: Array.isArray(data.recentMessages) ? data.recentMessages : [],
          greeting: data.greeting ?? null,
        })
      } catch {
        faceSessionStartedRef.current = false
      }
    }
    delays.forEach((delay) => {
      timeouts.push(setTimeout(runAttempt, delay))
    })
    return () => timeouts.forEach(clearTimeout)
  }, [cameraOpen, identity.sessionReady])

  useEffect(() => {
    if (!cameraOpen) setFaceServiceUnavailable(false)
  }, [cameraOpen])

  // Set lifecycle once on mount (time-of-day fallback until server start is fetched)
  useEffect(() => {
    setLifecycle(getLifecycleStage(serverStartTimeRef.current))
  }, [])

  // Fetch cycle start time once on mount; lifecycle uses it for born→baby→adult→old→dead cycle
  useEffect(() => {
    fetch("/api/lifecycle", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const start = typeof data.startTime === "number" ? data.startTime : 0
        serverStartTimeRef.current = start
        setServerStartTime(start)
        setLifecycle(getLifecycleStage(start))
      })
      .catch((err) => {
        console.error("Failed to fetch lifecycle info:", err)
        const fallbackStart = 0
        serverStartTimeRef.current = fallbackStart
        setServerStartTime(fallbackStart)
        setLifecycle(getLifecycleStage(fallbackStart))
      })
  }, [])

  // Update lifecycle every 5s (uses server start time for full cycle when available)
  useEffect(() => {
    const interval = setInterval(() => {
      setLifecycle(getLifecycleStage(serverStartTimeRef.current))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Get the rate of change for the selected interval
  const intervalChange = priceData.priceChanges?.[selectedInterval] || 0

  // Determine trend based on selected interval
  const trend = intervalChange > 0
    ? "up"
    : intervalChange < 0
    ? "down"
    : "neutral"

  // Weather + price summary for system prompt so otter has full context
  const weatherContext = buildWeatherSummary(trend, weatherLayers, {
    price: priceData.price,
    changePercent: intervalChange,
    interval: selectedInterval,
  })

  // Determine if we're in an "angry" state (negative sentiment OR negative price)
  const isAngry = chatSentiment === "negative" || intervalChange < 0

  // Handler for triggering one-shot GIFs
  const playOneShotGif = useCallback((gif: OneShotGif) => {
    // Don't interrupt if already playing a one-shot
    if (oneShotGif) return
    
    // Store current state to return to after one-shot completes
    setPreviousGifState(gifState)
    setOneShotGif(gif)
    
    // Return to previous state after GIF plays once
    setTimeout(() => {
      setOneShotGif(null)
    }, ONE_SHOT_GIF_DURATION)
  }, [oneShotGif, gifState])

  // Calculate effective GIF state (one-shot takes priority)
  const effectiveGifState = oneShotGif || gifState

  useEffect(() => {
    // Don't update base gifState while playing one-shot
    if (oneShotGif) return
    
    if (priceData.price > 0) {
      let newState: GifState = gifState
      
      // If angry (negative sentiment or price down)
      if (isAngry) {
        // If speaking → sad GIF, otherwise sad_idle with intensity
        if (isSpeaking) {
          newState = "sad"
        } else {
          // Use intensity based on price change when not speaking
          // Variation only for Adult
          if (lifecycle.stage === "adult") {
            newState = getIdleIntensity(intervalChange, false)
          } else {
            newState = "sad_idle"
          }
        }
      }
      // If happy/positive state
      else if (chatSentiment === "positive" || intervalChange > 0) {
        // If speaking → happy GIF
        if (isSpeaking) {
          newState = "happy"
        } else {
          // Not speaking → idle GIF with intensity based on price change
          // Variation only for Adult
          if (lifecycle.stage === "adult") {
            newState = getIdleIntensity(intervalChange, true)
          } else {
            newState = "idle"
          }
        }
      }
      // Neutral state
      else {
        if (isSpeaking) {
          newState = "happy"
        } else {
          // Neutral with no movement - use default idle
          newState = "idle"
        }
      }
      
      if (newState !== gifState) {
        setGifState(newState)
      }
    }
  }, [priceData, chatSentiment, gifState, intervalChange, selectedInterval, isSpeaking, isAngry, oneShotGif, lifecycle.stage])

  return (
    <main className="fixed inset-0 w-full h-screen overflow-hidden" style={{ background: "var(--chat-page-bg)" }}>
      {/* Full Screen Otter Display with Chart Background */}
      <FullscreenOtterDisplay 
        chatSentiment={chatSentiment}
        priceData={priceData}
        gifState={effectiveGifState}
        trend={trend}
        priceChangePercent={intervalChange}
        selectedInterval={selectedInterval}
        onIntervalChange={setSelectedInterval}
        onOtterClick={(gif) => {
          if (lifecycle.canInteract) {
            if (lifecycle.stage === "baby" || lifecycle.stage === "old") {
              playOneShotGif("slap")
            } else {
              playOneShotGif(gif)
            }
          }
        }}
        lifecycle={lifecycle}
        weatherLayers={weatherLayers}
      />

      {/* Navigation — same base as page so no black bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-4 md:top-6 md:left-6 z-50"
      >
        <Link
          href="/"
          className="group flex items-center gap-2 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 md:px-4 md:py-2 text-white transition-all duration-300 hover:bg-white/10"
          style={{ background: "var(--chat-page-surface)" }}
        >
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs md:text-sm font-medium">Back</span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <a
          href="https://tiktok.com/@marcelldegen"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 md:px-6 md:py-2 text-white transition-all duration-300 group shadow-lg hover:bg-white/10"
          style={{ background: "var(--chat-page-surface)" }}
        >
          <div className="w-4 h-4 md:w-5 md:h-5">
            <TikTokIcon />
          </div>
          <span className="text-xs md:text-sm font-bold tracking-tight">TikTok</span>
        </a>
      </motion.div>

      {/* AR view — opened via AR button in chat input area */}
      {arOpen && (
        <ArOtterView
          gifState={effectiveGifState}
          lifecycle={lifecycle}
          onClose={() => setArOpen(false)}
        />
      )}

      {/* Draggable self-view camera – only when user opts in (not forced on visit) */}
      {cameraOpen && <DraggableCamera />}

      <SideChatBubbles
        onSentimentChange={setChatSentiment}
        onSpeakingChange={setIsSpeaking}
        currentMood={gifState}
        currentTrend={trend}
        currentSentiment={chatSentiment}
        onHideChat={() => playOneShotGif("lower50")}
        lifecycle={lifecycle}
        cameraOpen={cameraOpen}
        onCameraToggle={() => setCameraOpen((prev) => !prev)}
        onArOpen={() => setArOpen(true)}
        identity={identity}
        onIdentityChange={setIdentity}
        weatherContext={weatherContext}
        faceServiceUnavailable={faceServiceUnavailable}
      />
    </main>
  )
}

