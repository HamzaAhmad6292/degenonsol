/**
 * Weather system types for multi-coin layered effects.
 * Phase 1: main (DEGEN) + btc (wind) + eth (fog).
 */

export type WeatherTrend = "up" | "down" | "neutral"

/** Runtime state for a single layer (from price data). */
export interface LayerState {
  id: string
  trend: WeatherTrend
  priceChangePercent: number
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

/** Full weather config (Phase 1: main + btc + eth layers). */
export interface WeatherConfig {
  mainWeather: MainWeatherConfig
  layers: WeatherLayerConfig[]
}

/** Typed layers for display (btc/eth only in Phase 1). */
export interface WeatherLayersState {
  btc?: LayerState
  eth?: LayerState
}
