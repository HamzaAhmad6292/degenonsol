"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { VideoOff } from "lucide-react"

const STORAGE_KEY = "degen-camera-position"
const DEFAULT_MARGIN = 16
const MIN_SIZE = 120
const MAX_SIZE = 280

interface SavedPosition {
  x: number
  y: number
  width: number
}

function loadPosition(): SavedPosition | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SavedPosition
    if (typeof parsed.x === "number" && typeof parsed.y === "number") return parsed
  } catch {
    // ignore
  }
  return null
}

function savePosition(pos: SavedPosition) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
  } catch {
    // ignore
  }
}

export function DraggableCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, left: 0, top: 0 })

  const saved = loadPosition()
  const [position, setPosition] = useState<{ x: number; y: number; width: number }>(() => {
    if (saved) return saved
    return {
      x: typeof window !== "undefined" ? window.innerWidth - MIN_SIZE - DEFAULT_MARGIN : 0,
      y: typeof window !== "undefined" ? window.innerHeight - MIN_SIZE - DEFAULT_MARGIN : 0,
      width: Math.min(180, typeof window !== "undefined" ? Math.max(MIN_SIZE, window.innerWidth * 0.22) : 180),
    }
  })

  // Request webcam
  useEffect(() => {
    let mounted = true
    setError(null)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" }, audio: false })
      .then((s) => {
        if (!mounted) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = s
        setStream(s)
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Camera access denied")
      })
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
  }, [stream])

  const clampPosition = useCallback(
    (x: number, y: number, w: number) => {
      const maxX = typeof window !== "undefined" ? window.innerWidth - w - DEFAULT_MARGIN : 0
      const maxY = typeof window !== "undefined" ? window.innerHeight - w - DEFAULT_MARGIN : 0
      return {
        x: Math.max(DEFAULT_MARGIN, Math.min(maxX, x)),
        y: Math.max(DEFAULT_MARGIN, Math.min(maxY, y)),
        width: Math.max(MIN_SIZE, Math.min(MAX_SIZE, w)),
      }
    },
    []
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return
      e.preventDefault()
      const left = position.x
      const top = position.y
      dragStartRef.current = { x: e.clientX, y: e.clientY, left, top }
      setIsDragging(true)
      containerRef.current?.setPointerCapture?.(e.pointerId)
    },
    [position.x, position.y]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStartRef.current.x
      const dy = e.clientY - dragStartRef.current.y
      const next = clampPosition(
        dragStartRef.current.left + dx,
        dragStartRef.current.top + dy,
        position.width
      )
      setPosition(next)
    },
    [isDragging, position.width, clampPosition]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "touch") return
      containerRef.current?.releasePointerCapture?.(e.pointerId)
      setIsDragging(false)
      savePosition(position)
    },
    [position]
  )

  const handlePointerCancel = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Resize on window change: keep within viewport
  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => {
        const next = clampPosition(prev.x, prev.y, prev.width)
        if (next.x !== prev.x || next.y !== prev.y || next.width !== prev.width) return next
        return prev
      })
    }
    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [clampPosition])

  if (error) return null

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed z-[45] touch-none select-none"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        aspectRatio: "1",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-white/30 bg-black/80 shadow-xl ring-2 ring-black/40"
        style={{
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {stream ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <VideoOff className="w-8 h-8 text-white/50" />
          </div>
        )}
        <div className="absolute bottom-1 left-1 right-1 flex justify-center">
          <span className="text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
            Drag to move
          </span>
        </div>
      </div>
    </motion.div>
  )
}
