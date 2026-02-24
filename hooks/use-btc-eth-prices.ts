"use client"

import { useEffect, useState, useRef } from "react"
import type {
  LayerPriceChanges,
  LayerState,
  WeatherInterval,
  WeatherLayersState,
} from "@/lib/weather-types"

/** Use our API proxy to avoid CORS (CoinGecko blocks direct browser requests). */
const PRICES_API = "/api/weather/prices"

const POLL_INTERVAL_MS = 10_000

function trendFromChange(change: number): "up" | "down" | "neutral" {
  if (change > 0) return "up"
  if (change < 0) return "down"
  return "neutral"
}

const emptyChanges: LayerPriceChanges = {
  m5: 0,
  h1: 0,
  h24: 0,
}

interface WeatherApiAsset {
  id: "btc" | "sol"
  priceUsd?: number
  changes?: Partial<LayerPriceChanges>
}

interface WeatherApiResponse {
  assets?: {
    btc?: WeatherApiAsset
    sol?: WeatherApiAsset
  }
}

function parseWeatherLayers(data: unknown, selectedInterval: WeatherInterval): WeatherLayersState {
  const layers: WeatherLayersState = {}
  if (!data || typeof data !== "object") return layers

  const payload = data as WeatherApiResponse
  layers.btc = buildLayerState(payload.assets?.btc, "btc", selectedInterval)
  layers.sol = buildLayerState(payload.assets?.sol, "sol", selectedInterval)

  return layers
}

function buildLayerState(
  asset: WeatherApiAsset | undefined,
  id: "btc" | "sol",
  selectedInterval: WeatherInterval
): LayerState | undefined {
  if (!asset) return undefined
  const rawChanges = asset.changes ?? {}
  const priceChanges: LayerPriceChanges = {
    m5: typeof rawChanges.m5 === "number" ? rawChanges.m5 : 0,
    h1: typeof rawChanges.h1 === "number" ? rawChanges.h1 : 0,
    h24: typeof rawChanges.h24 === "number" ? rawChanges.h24 : 0,
  }
  const selectedChange = priceChanges[selectedInterval]
  return {
    id,
    trend: trendFromChange(selectedChange),
    priceChangePercent: selectedChange,
    priceUsd: typeof asset.priceUsd === "number" ? asset.priceUsd : 0,
    priceChanges,
    interval: selectedInterval,
  }
}

export function useBtcEthPrices(
  intervalMs: number = POLL_INTERVAL_MS,
  selectedInterval: WeatherInterval = "m5"
): {
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
        const res = await fetch(`${PRICES_API}?interval=${selectedInterval}`)
        if (!res.ok) {
          if (mountedRef.current) setLayers({})
          return
        }
        const data = await res.json()
        if (!mountedRef.current) return
        setLayers(parseWeatherLayers(data, selectedInterval))
      } catch (err) {
        console.error("Error fetching BTC/SOL weather layers:", err)
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
  }, [intervalMs, selectedInterval])

  return { layers, loading }
}
