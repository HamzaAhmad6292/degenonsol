"use client"

import { useEffect, useState, useRef } from "react"
import type { LayerState, WeatherLayersState } from "@/lib/weather-types"

/** Use our API proxy to avoid CORS (CoinGecko blocks direct browser requests). */
const PRICES_API = "/api/weather/prices"

const POLL_INTERVAL_MS = 10_000

function trendFromChange(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up"
  if (change < 0) return "down"
  return "neutral"
}

function parseBtcEth(data: unknown): WeatherLayersState {
  const layers: WeatherLayersState = {}
  if (!data || typeof data !== "object") return layers

  const btc = (data as Record<string, unknown>)["bitcoin"]
  if (btc && typeof btc === "object" && "usd" in btc) {
    const b = btc as Record<string, unknown>
    const change = typeof b.usd_24h_change === "number" ? b.usd_24h_change : 0
    layers.btc = {
      id: "btc",
      trend: trendFromChange(change),
      priceChangePercent: change,
    }
  }

  const eth = (data as Record<string, unknown>)["ethereum"]
  if (eth && typeof eth === "object" && "usd" in eth) {
    const e = eth as Record<string, unknown>
    const change = typeof e.usd_24h_change === "number" ? e.usd_24h_change : 0
    layers.eth = {
      id: "eth",
      trend: trendFromChange(change),
      priceChangePercent: change,
    }
  }

  return layers
}

export function useBtcEthPrices(intervalMs: number = POLL_INTERVAL_MS): {
  layers: WeatherLayersState
  loading: boolean
} {
  const [layers, setLayers] = useState<WeatherLayersState>({})
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const fetchPrices = async () => {
      try {
        const res = await fetch(PRICES_API)
        if (!res.ok) {
          if (mountedRef.current) setLayers({})
          return
        }
        const data = await res.json()
        if (!mountedRef.current) return
        setLayers(parseBtcEth(data))
      } catch (err) {
        console.error("Error fetching BTC/ETH prices:", err)
        if (mountedRef.current) setLayers({})
      } finally {
        if (mountedRef.current) setLoading(false)
      }
    }

    fetchPrices()
    const id = setInterval(fetchPrices, intervalMs)
    return () => {
      mountedRef.current = false
      clearInterval(id)
    }
  }, [intervalMs])

  return { layers, loading }
}
