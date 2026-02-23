import { NextResponse } from "next/server"

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true"

/**
 * Proxy CoinGecko BTC/ETH prices to avoid CORS when called from the browser.
 * Server-side fetch is not subject to CORS.
 */
export async function GET() {
  try {
    const res = await fetch(COINGECKO_URL, {
      next: { revalidate: 60 },
    })
    if (!res.ok) {
      return NextResponse.json(
        { error: "CoinGecko request failed" },
        { status: res.status }
      )
    }
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Error proxying BTC/ETH prices:", err)
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 502 }
    )
  }
}
