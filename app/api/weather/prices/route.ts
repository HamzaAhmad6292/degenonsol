import { NextResponse } from "next/server"

const COINS = {
  btc: "bitcoin",
  sol: "solana",
} as const

const MS = {
  m5: 5 * 60 * 1000,
  h1: 60 * 60 * 1000,
  h24: 24 * 60 * 60 * 1000,
} as const

type IntervalKey = keyof typeof MS

interface CoinGeckoMarketChartResponse {
  prices?: [number, number][]
}

interface AssetWeatherPayload {
  id: "btc" | "sol"
  priceUsd: number
  changes: Record<IntervalKey, number>
}

/**
 * Proxy CoinGecko BTC/SOL weather data and compute m5/h1/h24 deltas.
 * Server-side fetch avoids browser CORS limits.
 */
export async function GET() {
  try {
    const [btc, sol] = await Promise.all([
      fetchCoinChanges("btc"),
      fetchCoinChanges("sol"),
    ])

    return NextResponse.json({
      assets: {
        btc,
        sol,
      },
      source: "coingecko_market_chart",
      generatedAt: Date.now(),
    })
  } catch (err) {
    console.error("Error proxying BTC/SOL weather data:", err)
    return NextResponse.json(
      { error: "Failed to fetch weather prices" },
      { status: 502 }
    )
  }
}

async function fetchCoinChanges(id: keyof typeof COINS): Promise<AssetWeatherPayload> {
  const coinId = COINS[id]
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`
  const res = await fetch(url, { next: { revalidate: 30 } })
  if (!res.ok) {
    throw new Error(`CoinGecko request failed for ${coinId}: ${res.status}`)
  }

  const data = (await res.json()) as CoinGeckoMarketChartResponse
  const prices = Array.isArray(data.prices) ? data.prices : []
  const latestPoint = prices[prices.length - 1]
  if (!latestPoint || typeof latestPoint[0] !== "number" || typeof latestPoint[1] !== "number") {
    throw new Error(`No usable price data for ${coinId}`)
  }

  const latestTimestamp = latestPoint[0]
  const latestPrice = latestPoint[1]
  return {
    id,
    priceUsd: latestPrice,
    changes: {
      m5: computePercentChange(prices, latestTimestamp, MS.m5),
      h1: computePercentChange(prices, latestTimestamp, MS.h1),
      h24: computePercentChange(prices, latestTimestamp, MS.h24),
    },
  }
}

function computePercentChange(
  prices: [number, number][],
  latestTimestamp: number,
  windowMs: number
): number {
  const latest = prices[prices.length - 1]?.[1]
  if (typeof latest !== "number" || latest <= 0) return 0

  const targetTime = latestTimestamp - windowMs
  const baselinePoint = prices.find(([timestamp]) => timestamp >= targetTime) ?? prices[0]
  const baseline = baselinePoint?.[1]
  if (typeof baseline !== "number" || baseline <= 0) return 0

  return ((latest - baseline) / baseline) * 100
}
