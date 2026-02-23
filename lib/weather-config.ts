import type { WeatherConfig } from "./weather-types"

// Next.js and Vite support JSON import; adjust if your bundler does not
import weatherLayersJson from "@/config/weather-layers.json"

const config = weatherLayersJson as WeatherConfig

export function getWeatherConfig(): WeatherConfig {
  return config
}

export function getLayerConfig(id: string) {
  return config.layers.find((l) => l.id === id)
}
