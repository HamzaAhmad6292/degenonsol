/**
 * Weather system types for multi-coin layered effects.
 * Phase 1: main (DEGEN) + btc atmospheric layer (wind + sky/fog mood).
 */

export type WeatherTrend = "up" | "down" | "neutral"
export type WeatherInterval = "m5" | "h1" | "h24"

export interface LayerPriceChanges {
  m5: number
  h1: number
  h24: number
}

/** Runtime state for a single layer (from price data). */
export interface LayerState {
  id: "btc" | "sol"
  trend: WeatherTrend
  priceChangePercent: number
  priceUsd?: number
  priceChanges: LayerPriceChanges
  interval: WeatherInterval
}

/** Visual config for a layer (from JSON). */
export interface WeatherLayerVisuals {
  particles?: string
  motion?: string
  intensityFrom?: string
  thresholds?: { low: number; medium: number; high: number }
  warmGlow?: string
  coldFog?: string
  tint?: { up: string; down: string }
}

/** Single layer definition from config. */
export interface WeatherLayerConfig {
  id: string
  coinId: string
  name: string
  effect: string
  visuals?: WeatherLayerVisuals
  degenReactions: string[]
}

/** Main weather (life force) definition. */
export interface MainWeatherConfig {
  coinId: string
  description: string
  source: string
  tokenAddress: string
}

/** Full weather config (Phase 1: main + btc atmospheric layer). */
export interface WeatherConfig {
  mainWeather: MainWeatherConfig
  layers: WeatherLayerConfig[]
}

/** Typed layers for display (BTC macro + SOL local atmosphere). */
export interface WeatherLayersState {
  btc?: LayerState
  sol?: LayerState
}
