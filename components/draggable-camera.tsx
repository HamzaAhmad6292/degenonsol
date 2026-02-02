"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { GripVertical, Video, VideoOff, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const CAMERA_POSITION_KEY = "degen-camera-position"
const DEFAULT_WIDTH = 160
const DEFAULT_HEIGHT = 120
const MIN_WIDTH = 120
const MIN_HEIGHT = 90

/** Capture current video frame as base64 JPEG (no data URL prefix). Returns null if not ready. */
function captureVideoFrame(video: HTMLVideoElement): string | null {
  if (video.readyState < 2 || video.videoWidth === 0) return null
  const w = video.videoWidth
  const h = video.videoHeight
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(video, 0, 0, w, h)
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85)
  const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "")
  return base64
}

function getDefaultPosition() {
  if (typeof window === "undefined") return { x: 24, y: 24 }
  try {
    const stored = localStorage.getItem(CAMERA_POSITION_KEY)
    if (stored) {
      const { x, y } = JSON.parse(stored)
      const parsed = { x: Number(x) ?? 24, y: Number(y) ?? 24 }
      // On mobile, clamp to visible area (stored position may be from desktop)
      return clampPosition(parsed.x, parsed.y, DEFAULT_WIDTH, DEFAULT_HEIGHT)
    }
  } catch {
    // ignore
  }
  // Mobile: default bottom-right above keyboard/input so camera is visible
  const isNarrow = window.innerWidth < 640
  if (isNarrow) {
    return clampPosition(
      window.innerWidth - DEFAULT_WIDTH - 12,
      Math.min(80, window.innerHeight - DEFAULT_HEIGHT - 180),
      DEFAULT_WIDTH,
      DEFAULT_HEIGHT
    )
  }
  return { x: 24, y: 24 }
}

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  const maxX = typeof window !== "undefined" ? window.innerWidth - width - 8 : 400
  const maxY = typeof window !== "undefined" ? window.innerHeight - height - 8 : 400
  return {
    x: Math.max(8, Math.min(x, maxX)),
    y: Math.max(8, Math.min(y, maxY)),
  }
}

export interface DraggableCameraProps {
  /** Controlled visibility (e.g. from bottom bar toggle on mobile). */
  isVisible?: boolean
  /** Called when user toggles visibility (e.g. close button). */
  onVisibleChange?: (visible: boolean) => void
  /** Called with a function that captures the current camera frame as base64 JPEG when camera is on; called with no-op when off. */
  onRegisterGetFrame?: (getFrame: () => Promise<string | null>) => void
}

export function DraggableCamera({ isVisible: controlledVisible, onVisibleChange, onRegisterGetFrame }: DraggableCameraProps) {
  const [position, setPosition] = useState(() => ({ x: 24, y: 24 }))
  const [isDragging, setIsDragging] = useState(false)
  const [internalVisible, setInternalVisible] = useState(true)
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible
  const setVisible = useCallback(
    (v: boolean) => {
      if (onVisibleChange) onVisibleChange(v)
      else setInternalVisible(v)
    },
    [onVisibleChange]
  )

  // Restore saved position on mount (client-only)
  useEffect(() => {
    setPosition(getDefaultPosition())
  }, [])
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 })
  const videoRef = useRef<HTMLVideoElement>(null)

  // Request camera on mount
  useEffect(() => {
    let mounted = true
    setError(null)
    setIsLoading(true)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false })
      .then((s) => {
        if (mounted && videoRef.current) {
          setStream(s)
          videoRef.current.srcObject = s
          setError(null)
        } else {
          s.getTracks().forEach((t) => t.stop())
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Camera access denied")
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [])

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [stream])

  // Register getCameraFrame when camera is on; clear when off. Getter reads videoRef when called.
  useEffect(() => {
    if (!onRegisterGetFrame) return
    if (!isVisible || !stream || error) {
      onRegisterGetFrame(() => Promise.resolve(null))
      return
    }
    onRegisterGetFrame(() => {
      const v = videoRef.current
      return Promise.resolve(v ? captureVideoFrame(v) : null)
    })
  }, [onRegisterGetFrame, isVisible, stream, error])

  const handlePointerStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true)
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        posX: position.x,
        posY: position.y,
      }
    },
    [position]
  )
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      if ((e.target as HTMLElement).closest("button")) return
      handlePointerStart(e.clientX, e.clientY)
    },
    [handlePointerStart]
  )
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest("button")) return
      const t = e.touches[0]
      if (t) handlePointerStart(t.clientX, t.clientY)
    },
    [handlePointerStart]
  )

  const positionRef = useRef(position)
  positionRef.current = position

  useEffect(() => {
    if (!isDragging) return
    const onMove = (clientX: number, clientY: number) => {
      const dx = clientX - dragStartRef.current.x
      const dy = clientY - dragStartRef.current.y
      const next = clampPosition(
        dragStartRef.current.posX + dx,
        dragStartRef.current.posY + dy,
        DEFAULT_WIDTH,
        DEFAULT_HEIGHT
      )
      setPosition(next)
      dragStartRef.current = { ...dragStartRef.current, x: clientX, y: clientY }
    }
    const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      const t = e.touches[0]
      if (t) onMove(t.clientX, t.clientY)
    }
    const finish = () => {
      setIsDragging(false)
      try {
        localStorage.setItem(CAMERA_POSITION_KEY, JSON.stringify(positionRef.current))
      } catch {
        // ignore
      }
    }
    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", finish)
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", finish)
    window.addEventListener("touchcancel", finish)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", finish)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", finish)
      window.removeEventListener("touchcancel", finish)
    }
  }, [isDragging])

  if (!isVisible) {
    return (
      <Button
        onClick={() => setVisible(true)}
        className="fixed bottom-28 right-4 z-50 rounded-full w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 text-white shadow-lg md:bottom-24 md:right-6"
        title="Show camera"
      >
        <Video className="w-5 h-5" />
      </Button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed z-50 flex flex-col rounded-xl overflow-hidden shadow-xl border border-white/20 bg-black/80 backdrop-blur-md select-none touch-none"
      style={{
        left: position.x,
        top: position.y,
        width: DEFAULT_WIDTH,
        minWidth: MIN_WIDTH,
        minHeight: MIN_HEIGHT,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Header bar - drag handle */}
      <div className="flex items-center justify-between gap-1 px-2 py-1 bg-white/10 border-b border-white/10">
        <GripVertical className="w-3.5 h-3.5 text-white/60 shrink-0" />
        <span className="text-[10px] font-medium text-white/90 truncate flex-1 text-center">
          You
        </span>
        <div className="flex items-center gap-0.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded"
            onClick={() => setVisible(false)}
            title="Hide camera"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Video area */}
      <div
        className="relative flex items-center justify-center bg-black"
        style={{ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT }}
      >
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
            <VideoOff className="w-8 h-8 text-white/40 mb-1" />
            <p className="text-[10px] text-white/60">{error}</p>
          </div>
        )}
        {isLoading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1] pointer-events-none"
          style={{ display: stream && !error ? "block" : "none" }}
        />
      </div>
    </motion.div>
  )
}
