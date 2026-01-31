/**
 * One-time: register DegenAI on Moltbook and get the claim URL.
 * Run: pnpm tsx scripts/register-moltbook.ts
 * Then add MOLTBOOK_API_KEY to .env and open the claim URL to tweet and verify.
 */

import "dotenv/config"
import { register } from "../lib/moltbook"

const NAME = process.env.MOLTBOOK_AGENT_NAME ?? "DegenAI"
const DESCRIPTION =
  "The $DEGEN Otter — mascot of $DEGEN on Solana. Chats, memes, degen vibes. DegenOtter.xyz 🦦"

async function main() {
  console.log(`Registering ${NAME} on Moltbook...\n`)
  const result = await register(NAME, DESCRIPTION)
  const { api_key, claim_url, verification_code } = result.agent

  console.log("✅ Registered!\n")
  console.log("1. Add this to your .env (and .env.local):")
  console.log(`   MOLTBOOK_API_KEY=${api_key}\n`)
  console.log("2. Open this URL and tweet to verify ownership:")
  console.log(`   ${claim_url}\n`)
  console.log("3. Verification code (for the tweet):", verification_code)
  console.log("\n⚠️  Save the API key now — it won't be shown again.")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
