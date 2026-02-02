"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X, Camera } from "lucide-react"
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

/** Back camera + GIF overlay. Same experience for all devices (replica of current otter GIF). */
export function ArOtterView({ gifState, lifecycle, onClose }: ArOtterViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const gifImgRef = useRef<HTMLImageElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [gifError, setGifError] = useState(false)
  const [photoFeedback, setPhotoFeedback] = useState(false)

  // Current GIF path – replica of what’s on the main screen (state doesn’t change behavior)
  const gifPath = getGifPathForAr(gifState, lifecycle)
  const gifSrc = getAbsoluteGifUrl(gifPath)
  const fallbackGifSrc = getAbsoluteGifUrl("/gifs/idle.gif")

  const streamRef = useRef<MediaStream | null>(null)

  // Request back (environment) camera as soon as AR view opens
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

    // Prefer back camera; fall back to any camera so something always shows
    tryCamera({
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    }).catch(() => {
      if (mounted) {
        tryCamera({ video: true, audio: false })
      }
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

    // Draw video (object-cover style: scale to cover canvas)
    const vw = video.videoWidth
    const vh = video.videoHeight
    if (vw === 0 || vh === 0) return
    const scale = Math.max(w / vw, h / vh)
    const sw = vw
    const sh = vh
    const dw = vw * scale
    const dh = vh * scale
    const dx = (w - dw) / 2
    const dy = (h - dh) / 2
    ctx.drawImage(video, 0, 0, sw, sh, dx, dy, dw, dh)

    // Draw GIF overlay (center, 70% of min dimension, square)
    if (img?.complete && img.naturalWidth > 0) {
      const size = 0.7 * Math.min(w, h)
      const gx = (w - size) / 2
      const gy = (h - size) / 2
      ctx.drawImage(img, gx, gy, size, size)
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
  }, [])

  return (
    <div className="fixed inset-0 z-100 bg-black">
      {/* Camera feed – always render so layout is correct; stream fills it when ready */}
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
      {/* GIF overlay – replica of current otter, full URL for ngrok */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[min(70vw,70vh)] h-[min(70vw,70vh)] flex items-center justify-center"
          style={{ aspectRatio: "1" }}
        >
          <img
            ref={gifImgRef}
            src={gifError ? fallbackGifSrc : gifSrc}
            alt="Otter AR"
            className="w-full h-full object-contain drop-shadow-2xl"
            style={{ maxHeight: "100%" }}
            onError={() => setGifError(true)}
          />
        </div>
      </div>
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2">
        <div className="flex items-center justify-center gap-4">
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
        <p className="text-white/80 text-sm">Point your camera — otter is overlaid on the feed.</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        aria-label="Close AR"
      >
        <X className="w-6 h-6" />
      </button>
    </div>
  )
}
