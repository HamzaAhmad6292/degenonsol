/**
 * Run the face memory migration (tables + pgvector + RPC) against your Supabase Postgres database.
 *
 * Usage:
 *   Set SUPABASE_DATABASE_URL in .env (or DATABASE_URL), then:
 *   npm run db:migrate:face-memory
 *
 * Get the connection string from Supabase Dashboard:
 *   Project Settings → Database → Connection string (URI).
 *   Use the "Session mode" or "Transaction" URI and replace [YOUR-PASSWORD] with your database password.
 */

import { config } from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"
import { Client } from "pg"

config({ path: join(process.cwd(), ".env") })

const migrationPath = join(process.cwd(), "supabase", "migrations", "001_face_memory.sql")

async function main() {
  const connectionString =
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL

  if (!connectionString) {
    console.error(
      "Missing SUPABASE_DATABASE_URL or DATABASE_URL. Set one of these in .env to your Supabase Postgres connection string (Project Settings → Database → Connection string)."
    )
    process.exit(1)
  }

  const sql = readFileSync(migrationPath, "utf-8")
  const client = new Client({ connectionString })

  try {
    await client.connect()
    await client.query(sql)
    console.log("Face memory migration completed: vector extension, face_users, face_embeddings, conversations, messages, match_face_embedding RPC.")
  } catch (err) {
    console.error("Migration failed:", err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
