import { getSupabase } from "@/lib/db"

const DEFAULT_SIMILARITY_THRESHOLD = 0.25

export interface FaceMatch {
  userId: string
  displayName: string | null
}

/**
 * Find a face user whose embedding is closest to the query, within threshold (cosine distance).
 */
export async function findMatchingUser(
  embedding: number[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD
): Promise<FaceMatch | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase.rpc("match_face_embedding", {
    query_embedding: embedding,
    match_threshold: threshold,
  })
  if (error || !data || data.length === 0) return null
  const row = data[0] as { user_id: string; display_name: string | null }
  return { userId: row.user_id, displayName: row.display_name }
}

/**
 * Create a new face user and store their embedding. Returns the new user id.
 */
export async function registerUser(embedding: number[]): Promise<string> {
  const supabase = getSupabase()
  const { data: userData, error: userError } = await supabase
    .from("face_users")
    .insert({ display_name: null })
    .select("id")
    .single()
  if (userError || !userData) throw new Error(userError?.message ?? "Failed to create face_users row")
  const userId = userData.id as string
  const { error: embedError } = await supabase.from("face_embeddings").insert({
    user_id: userId,
    embedding,
  })
  if (embedError) throw new Error(embedError.message)
  return userId
}

/**
 * Get the most recent conversation for this user, or create one.
 */
export async function getOrCreateConversation(userId: string): Promise<string> {
  const supabase = getSupabase()
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  if (existing?.id) return existing.id as string
  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId })
    .select("id")
    .single()
  if (error || !created) throw new Error(error?.message ?? "Failed to create conversation")
  return created.id as string
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  created_at?: string
}

/**
 * Load last N messages for a conversation, ordered by created_at asc.
 */
export async function getRecentMessages(
  conversationId: string,
  limit: number = 20
): Promise<ChatMessage[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => ({
    role: r.role as "user" | "assistant",
    content: r.content,
    created_at: r.created_at as string | undefined,
  }))
}

/**
 * Append one message to a conversation.
 */
export async function persistMessage(
  conversationId: string,
  role: "user" | "assistant" | "system",
  content: string
): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    role,
    content,
  })
  if (error) throw new Error(error.message)
}

/**
 * Update display name for a face user (called when NameAgent detects a name).
 */
export async function updateDisplayName(userId: string, name: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("face_users")
    .update({ display_name: name, updated_at: new Date().toISOString() })
    .eq("id", userId)
  if (error) throw new Error(error.message)
}

/**
 * Get display name for a user (for chat system prompt).
 */
export async function getDisplayName(userId: string): Promise<string | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("face_users")
    .select("display_name")
    .eq("id", userId)
    .single()
  if (error || !data) return null
  return (data.display_name as string | null) ?? null
}
