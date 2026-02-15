/**
 * Detect Solana wallet in user text and fetch $DEGEN (SPL) balance for LLM context.
 * Only used when user explicitly mentions a wallet address in chat.
 */

/** $DEGEN token mint on Solana (same as token-price-fetcher / DexScreener) */
export const DEGEN_MINT = "4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"

/** Base58 alphabet (no 0,O,I,l) — Solana addresses */
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/** Extract first Solana-like wallet address from text (explicit mention) */
export function extractSolanaWalletFromText(text: string): string | null {
  const trimmed = text.trim()
  if (!trimmed) return null
  const tokens = trimmed.split(/\s+/)
  for (const t of tokens) {
    const cleaned = t.replace(/[,.]$/, "")
    if (BASE58.test(cleaned)) return cleaned
  }
  const match = trimmed.match(/\b([1-9A-HJ-NP-Za-km-z]{32,44})\b/)
  return match ? match[1] : null
}

const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"

export interface DegenBalanceResult {
  wallet: string
  rawAmount: string
  uiAmount: number
  decimals: number
  error?: string
}

/**
 * Fetch $DEGEN token balance for a wallet via Solana RPC getTokenAccountsByOwner.
 */
export async function fetchDegenBalanceForWallet(wallet: string): Promise<DegenBalanceResult | null> {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getTokenAccountsByOwner",
        params: [
          wallet,
          { mint: DEGEN_MINT },
          { encoding: "jsonParsed" },
        ],
      }),
    })
    const data = await res.json()
    if (data.error) return { wallet, rawAmount: "0", uiAmount: 0, decimals: 6, error: data.error.message }

    const value = data.result?.value ?? []
    if (value.length === 0) {
      return { wallet, rawAmount: "0", uiAmount: 0, decimals: 6 }
    }

    const first = value[0]
    const info = first?.account?.data?.parsed?.info
    if (!info?.tokenAmount) {
      return { wallet, rawAmount: "0", uiAmount: 0, decimals: 6 }
    }

    const amount = info.tokenAmount.amount ?? "0"
    const decimals = info.tokenAmount.decimals ?? 6
    const uiAmount = info.tokenAmount.uiAmount ?? 0

    return { wallet, rawAmount: amount, uiAmount, decimals }
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e)
    return { wallet, rawAmount: "0", uiAmount: 0, decimals: 6, error: err }
  }
}

/** Format balance for LLM: short wallet + human-readable amount */
export function formatWalletBalanceForContext(result: DegenBalanceResult): string {
  const short = `${result.wallet.slice(0, 4)}…${result.wallet.slice(-4)}`
  const amount = result.uiAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })
  if (result.error) {
    return `User shared a Solana wallet (${short}). Balance lookup failed: ${result.error}. You can still acknowledge they shared a wallet.`
  }
  return `User shared their Solana wallet (${short}). That wallet holds **${amount} $DEGEN**. Use this when relevant; respond in a way that matches your current mood (sarcastic, rude, humorous, or proper).`
}
