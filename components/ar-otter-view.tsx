"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X, Camera, RotateCcw } from "lucide-react"
import type { GifState } from "@/app/chat/page"
import type { LifecycleInfo } from "@/lib/lifecycle"
import { getGifPathForAr } from "@/lib/ar-gif-path"

interface ArOtterViewProps {
  gifState: GifState
  lifecycle: LifecycleInfo
  onClose: () => void
}

/** Full URL for GIF so it works over ngrok / different origins */
function getAbsoluteGifUrl(path: string): string {
  if (typeof window === "undefined") return path
  const base = path.startsWith("/") ? window.location.origin + path : path
  return base
}

/** Distance between two points */
function dist(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(b.x - a.x, b.y - a.y)
}

/** Angle in degrees from a to b (for rotation) */
function angle(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}

const MIN_SCALE = 0.3
const MAX_SCALE = 2.5
const DEFAULT_SCALE = 1

/** Back camera + GIF overlay with drag, pinch-zoom, rotate, photo, reset. */
export function ArOtterView({ gifState, lifecycle, onClose }: ArOtterViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const gifImgRef = useRef<HTMLImageElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gifError, setGifError] = useState(false)
  const [photoFeedback, setPhotoFeedback] = useState(false)
  const [hintVisible, setHintVisible] = useState(true)

  // Overlay transform: position (px from center), scale, rotation (deg)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(DEFAULT_SCALE)
  const [rotation, setRotation] = useState(0)

  // Gesture state
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map())
  const dragStartRef = useRef({ x: 0, y: 0, pos: { x: 0, y: 0 } })
  const pinchStartRef = useRef({
    distance: 0,
    angle: 0,
    scale: 1,
    rotation: 0,
    center: { x: 0, y: 0 },
  })
  const resizeStartRef = useRef({
    scale: 1,
    distance: 0,
    center: { x: 0, y: 0 },
  })
  const isResizingRef = useRef(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const positionRef = useRef(position)
  const scaleRef = useRef(scale)
  const rotationRef = useRef(rotation)
  positionRef.current = position
  scaleRef.current = scale
  rotationRef.current = rotation

  const streamRef = useRef<MediaStream | null>(null)

  // Current GIF path – replica of what's on the main screen
  const gifPath = getGifPathForAr(gifState, lifecycle)
  const gifSrc = getAbsoluteGifUrl(gifPath)
  const fallbackGifSrc = getAbsoluteGifUrl("/gifs/idle.gif")

  // Hide hint after 4s
  useEffect(() => {
    const t = setTimeout(() => setHintVisible(false), 4000)
    return () => clearTimeout(t)
  }, [])

  // Request back (environment) camera
  useEffect(() => {
    let mounted = true
    setError(null)
    const tryCamera = (constraints: MediaStreamConstraints) =>
      navigator.mediaDevices.getUserMedia(constraints).then(
        (s) => {
          if (!mounted) {
            s.getTracks().forEach((t) => t.stop())
            return
          }
          streamRef.current = s
          setError(null)
          setStream(s)
        },
        (err) => {
          if (!mounted) return
          setError(err.message || "Camera access denied")
        }
      )
    tryCamera({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    }).catch(() => {
      if (mounted) tryCamera({ video: true, audio: false })
    })
    return () => {
      mounted = false
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      setStream(null)
    }
  }, [])

  useEffect(() => {
    if (!stream || !videoRef.current) return
    videoRef.current.srcObject = stream
  }, [stream])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const id = e.pointerId
      const x = e.clientX
      const y = e.clientY
      const map = pointersRef.current
      map.set(id, { x, y })
      if (map.size === 1) {
        dragStartRef.current = {
          x,
          y,
          pos: { ...positionRef.current },
        }
      } else if (map.size === 2) {
        const [p1, p2] = Array.from(map.values())
        pinchStartRef.current = {
          distance: dist(p1, p2),
          angle: angle(p1, p2),
          scale: scaleRef.current,
          rotation: rotationRef.current,
          center: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
        }
      }
      ;(e.target as HTMLElement).setPointerCapture?.(id)
    },
    []
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      const id = e.pointerId
      const x = e.clientX
      const y = e.clientY
      const map = pointersRef.current
      map.set(id, { x, y })
      if (map.size === 1) {
        const start = dragStartRef.current
        setPosition({
          x: start.pos.x + (x - start.x),
          y: start.pos.y + (y - start.y),
        })
      } else if (map.size === 2) {
        const [p1, p2] = Array.from(map.values())
        const d = dist(p1, p2)
        const a = angle(p1, p2)
        const start = pinchStartRef.current
        if (start.distance > 0) {
          const newScale = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, start.scale * (d / start.distance))
          )
          setScale(newScale)
        }
        setRotation(start.rotation + (a - start.angle))
      }
    },
    []
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const map = pointersRef.current
    map.delete(e.pointerId)
    if (map.size === 1) {
      const [p] = Array.from(map.values())
      dragStartRef.current = {
        x: p.x,
        y: p.y,
        pos: { ...positionRef.current },
      }
    }
  }, [])

  const resetTransform = useCallback(() => {
    setPosition({ x: 0, y: 0 })
    setScale(DEFAULT_SCALE)
    setRotation(0)
  }, [])

  const overlayCenter = useCallback(() => ({
    x: window.innerWidth / 2 + positionRef.current.x,
    y: window.innerHeight / 2 + positionRef.current.y,
  }), [])

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      const center = overlayCenter()
      const d = dist(center, { x: e.clientX, y: e.clientY })
      if (d < 1) return
      isResizingRef.current = true
      resizeStartRef.current = {
        scale: scaleRef.current,
        distance: d,
        center,
      }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [overlayCenter]
  )

  const handleResizePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isResizingRef.current) return
    const start = resizeStartRef.current
    const d = dist(start.center, { x: e.clientX, y: e.clientY })
    if (start.distance <= 0) return
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, start.scale * (d / start.distance))
    )
    setScale(newScale)
  }, [])

  const handleResizePointerUp = useCallback((e: React.PointerEvent) => {
    isResizingRef.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }, [])

  const takePhoto = useCallback(() => {
    const video = videoRef.current
    const img = gifImgRef.current
    if (!video || video.readyState < 2) return

    const w = window.innerWidth
    const h = window.innerHeight
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const vw = video.videoWidth
    const vh = video.videoHeight
    if (vw === 0 || vh === 0) return
    const scaleV = Math.max(w / vw, h / vh)
    const dw = vw * scaleV
    const dh = vh * scaleV
    const dx = (w - dw) / 2
    const dy = (h - dh) / 2
    ctx.drawImage(video, 0, 0, vw, vh, dx, dy, dw, dh)

    if (img?.complete && img.naturalWidth > 0) {
      const baseSize = 0.7 * Math.min(w, h)
      const size = baseSize * scale
      const cx = w / 2
      const cy = h / 2
      const px = cx + position.x
      const py = cy + position.y
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.drawImage(img, -size / 2, -size / 2, size, size)
      ctx.restore()
    }

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `otter-ar-${Date.now()}.png`
        a.click()
        URL.revokeObjectURL(url)
        setPhotoFeedback(true)
        setTimeout(() => setPhotoFeedback(false), 2000)
      },
      "image/png",
      0.95
    )
  }, [position, scale, rotation])

  return (
    <div className="fixed inset-0 z-100 bg-black touch-none">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/90 text-center px-4 gap-2">
          <p>{error}</p>
          <p className="text-sm text-white/60">Allow camera access and try again.</p>
        </div>
      )}

      {/* Draggable, pinchable, rotatable GIF overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 flex items-center justify-center pointer-events-auto"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          className="relative flex items-center justify-center select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            width: "min(70vw, 70vh)",
            height: "min(70vw, 70vh)",
            aspectRatio: "1",
          }}
        >
          <img
            ref={gifImgRef}
            src={gifError ? fallbackGifSrc : gifSrc}
            alt="Otter AR"
            className="w-full h-full object-contain drop-shadow-2xl pointer-events-none"
            draggable={false}
            onError={() => setGifError(true)}
          />
          {/* Corner resize handle – drag to resize */}
          <div
            className="absolute bottom-0 right-0 w-10 h-10 cursor-se-resize touch-none flex items-end justify-end p-1"
            style={{ touchAction: "none" }}
            onPointerDown={handleResizePointerDown}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            aria-label="Resize"
            title="Drag to resize"
          >
            <span className="w-5 h-5 rounded-full bg-white/80 border-2 border-white shadow-md" />
          </div>
        </div>
      </div>

      {/* Onboarding hint – auto-hide */}
      {hintVisible && (
        <div
          className="absolute top-14 left-4 right-4 z-20 bg-black/60 backdrop-blur-sm text-white/90 text-xs text-center py-2 px-3 rounded-lg"
          role="button"
          tabIndex={0}
          onClick={() => setHintVisible(false)}
          onKeyDown={(e) => e.key === "Enter" && setHintVisible(false)}
          aria-label="Dismiss hint"
        >
          Drag to move • Pinch or drag corner to resize • Two-finger twist to rotate
        </div>
      )}

      {/* Bottom controls */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={resetTransform}
            className="p-3 rounded-full bg-black/50 text-white border border-white/20 hover:bg-black/70 active:scale-95 transition-all"
            aria-label="Reset position and size"
            title="Reset"
          >
            <RotateCcw className="w-6 h-6" />
          </button>
          <button
            type="button"
            onClick={takePhoto}
            disabled={!stream}
            className="p-4 rounded-full bg-white text-black shadow-lg hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Take photo"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>
        {photoFeedback && (
          <p className="text-white text-sm font-medium">Photo saved!</p>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Close AR"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  )
}
