/**
 * Face detection + embedding via CompreFace Detection API.
 * Returns a single face embedding (primary-face policy) or detected: false.
 */

export type FaceResult =
  | { detected: false }
  | { detected: true; embedding: number[] }

const COMPREFACE_URL = process.env.COMPREFACE_URL ?? ""
const COMPREFACE_DETECTION_API_KEY = process.env.COMPREFACE_DETECTION_API_KEY ?? ""
const FACE_DETECTION_CONFIDENCE = Number(process.env.FACE_DETECTION_CONFIDENCE) || 0.8

interface CompreFaceBox {
  probability?: number
  x_min?: number
  y_min?: number
  x_max?: number
  y_max?: number
}

interface CompreFaceResultItem {
  box?: CompreFaceBox
  embedding?: number[]
}

interface CompreFaceResponse {
  result?: CompreFaceResultItem[]
}

function dataUrlToBuffer(dataUrl: string): Buffer | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) return null
  try {
    return Buffer.from(match[2], "base64")
  } catch {
    return null
  }
}

function pickPrimaryFace(results: CompreFaceResultItem[]): CompreFaceResultItem | null {
  if (results.length === 0) return null
  if (results.length === 1) return results[0]
  let best = results[0]
  let bestArea = 0
  for (const r of results) {
    const box = r.box
    if (!box || box.x_max == null || box.x_min == null || box.y_max == null || box.y_min == null)
      continue
    const area = (box.x_max - box.x_min) * (box.y_max - box.y_min)
    if (area > bestArea) {
      bestArea = area
      best = r
    }
  }
  return best
}

/**
 * Detect face(s) in the frame and return one embedding (primary face) or detected: false.
 * Uses CompreFace Face Detection service with calculator plugin for 512-d embeddings.
 */
export async function detectAndEmbed(frameData: string): Promise<FaceResult> {
  if (!frameData || typeof frameData !== "string") return { detected: false }
  if (!COMPREFACE_URL || !COMPREFACE_DETECTION_API_KEY) {
    console.warn("CompreFace: COMPREFACE_URL or COMPREFACE_DETECTION_API_KEY not set")
    return { detected: false }
  }

  const buffer = dataUrlToBuffer(frameData)
  if (!buffer || buffer.length === 0) return { detected: false }

  const url = new URL("/api/v1/detection/detect", COMPREFACE_URL.replace(/\/$/, ""))
  url.searchParams.set("det_prob_threshold", String(FACE_DETECTION_CONFIDENCE))
  url.searchParams.set("face_plugins", "calculator")

  try {
    const blob = new Blob([buffer], { type: "image/jpeg" })
    const form = new FormData()
    form.append("file", blob, "frame.jpg")
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "x-api-key": COMPREFACE_DETECTION_API_KEY,
      },
      body: form,
    })
    if (!res.ok) {
      console.warn("CompreFace detect failed:", res.status, await res.text())
      return { detected: false }
    }
    const json = (await res.json()) as CompreFaceResponse
    const result = json?.result
    if (!Array.isArray(result) || result.length === 0) return { detected: false }

    const primary = pickPrimaryFace(result)
    if (!primary) return { detected: false }
    const prob = primary.box?.probability ?? 0
    if (prob < FACE_DETECTION_CONFIDENCE) return { detected: false }
    const embedding = primary.embedding
    if (!Array.isArray(embedding) || embedding.length !== 512) return { detected: false }

    return { detected: true, embedding: embedding as number[] }
  } catch (e) {
    console.warn("CompreFace detectAndEmbed error:", e)
    return { detected: false }
  }
}
