import { NextRequest } from "next/server"
import { detectAndEmbed } from "@/lib/agents/face-pipeline"
import { generateGreeting } from "@/lib/agents/greeting-agent"
import {
  findMatchingUser,
  getOrCreateConversation,
  getRecentMessages,
  registerUser,
} from "@/lib/face-db"

const FACE_SIMILARITY_THRESHOLD = Number(process.env.FACE_SIMILARITY_THRESHOLD) || 0.25

export interface FaceSessionResponse {
  status: "identified" | "registered" | "no_face" | "face_service_unavailable"
  userId: string | null
  displayName: string | null
  isNewUser: boolean
  greeting: string | null
  conversationId: string | null
  recentMessages: { role: "user" | "assistant"; content: string; created_at?: string }[]
}

const emptyResponse: FaceSessionResponse = {
  status: "no_face",
  userId: null,
  displayName: null,
  isNewUser: false,
  greeting: null,
  conversationId: null,
  recentMessages: [],
}

const COMPREFACE_URL = process.env.COMPREFACE_URL ?? ""
const COMPREFACE_DETECTION_API_KEY = process.env.COMPREFACE_DETECTION_API_KEY ?? ""

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json()
    const frameData = body?.frameData
    if (!frameData || typeof frameData !== "string") {
      return Response.json(emptyResponse, { status: 200 })
    }

    if (!COMPREFACE_URL || !COMPREFACE_DETECTION_API_KEY) {
      return Response.json(
        { ...emptyResponse, status: "face_service_unavailable" as const },
        { status: 200 }
      )
    }

    const faceResult = await detectAndEmbed(frameData)
    if (!faceResult.detected) {
      return Response.json(emptyResponse, { status: 200 })
    }

    let userId: string
    let displayName: string | null
    let isNewUser: boolean
    const match = await findMatchingUser(faceResult.embedding, FACE_SIMILARITY_THRESHOLD)
    if (match) {
      userId = match.userId
      displayName = match.displayName
      isNewUser = false
    } else {
      userId = await registerUser(faceResult.embedding)
      displayName = null
      isNewUser = true
    }

    const conversationId = await getOrCreateConversation(userId)
    const recentMessages = await getRecentMessages(conversationId, 20)
    const greeting = await generateGreeting({
      isNewUser,
      displayName,
      recentMessages,
    })

    return Response.json({
      status: isNewUser ? "registered" : "identified",
      userId,
      displayName,
      isNewUser,
      greeting,
      conversationId,
      recentMessages,
    } satisfies FaceSessionResponse)
  } catch (e) {
    console.error("Face session error:", e)
    const isConfigError =
      e instanceof Error &&
      (e.message?.includes("SUPABASE") || e.message?.includes("Missing"))
    return Response.json(
      {
        ...emptyResponse,
        status: isConfigError ? ("face_service_unavailable" as const) : emptyResponse.status,
      },
      { status: 200 }
    )
  }
}
