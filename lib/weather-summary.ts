import { getWeatherConfig } from "./weather-config"
import type { WeatherLayersState } from "./weather-types"

export interface MainPriceContext {
  price: number
  changePercent: number
  interval: "m5" | "h1" | "h24"
}

/**
 * Build a weather + price summary for the system prompt so the otter has full context.
 * Includes actual prices and percentages so Degen can reference them in conversation.
 */
export function buildWeatherSummary(
  mainTrend: "up" | "down" | "neutral",
  layers: WeatherLayersState,
  mainPriceContext?: MainPriceContext
): string {
  const config = getWeatherConfig()
  const parts: string[] = []

  const intervalLabel = mainPriceContext?.interval === "m5" ? "5m" : mainPriceContext?.interval === "h1" ? "1h" : "24h"
  if (mainPriceContext && mainPriceContext.price > 0) {
    parts.push(
      `$DEGEN (main): $${mainPriceContext.price.toFixed(6)}, ${mainTrend} ${mainPriceContext.changePercent >= 0 ? "+" : ""}${mainPriceContext.changePercent.toFixed(2)}% (${intervalLabel}).`
    )
  } else {
    parts.push(`Main (${config.mainWeather.coinId}): ${mainTrend}.`)
  }

  if (layers.btc) {
    const intensity =
      Math.abs(layers.btc.priceChangePercent) >= 2
        ? "strong wind"
        : Math.abs(layers.btc.priceChangePercent) >= 0.5
          ? "wind"
          : "calm"
    parts.push(
      `BTC (wind): ${layers.btc.priceChangePercent >= 0 ? "+" : ""}${layers.btc.priceChangePercent.toFixed(1)}% (24h), ${intensity}, ${layers.btc.trend}.`
    )
  }

  if (layers.eth) {
    const fog =
      layers.eth.trend === "up"
        ? "warm glow"
        : layers.eth.trend === "down"
          ? "cold fog"
          : "neutral"
    parts.push(
      `ETH (fog): ${layers.eth.priceChangePercent >= 0 ? "+" : ""}${layers.eth.priceChangePercent.toFixed(1)}% (24h), ${fog}, ${layers.eth.trend}.`
    )
  }

  return parts.join(" ")
}
