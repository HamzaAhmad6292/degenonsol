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
    const skyMood =
      layers.btc.trend === "up"
        ? "clear sky with warm haze"
        : layers.btc.trend === "down"
          ? "thicker cloud-fog and cooler sky"
          : "mixed clouds with light haze"
    parts.push(
      `BTC (macro sky): ${layers.btc.priceChangePercent >= 0 ? "+" : ""}${layers.btc.priceChangePercent.toFixed(1)}% (${intervalLabel}), ${intensity}, ${skyMood}, ${layers.btc.trend}.`
    )
  }

  if (layers.sol) {
    const localMood =
      layers.sol.trend === "up"
        ? "warmer local air and clearer fog"
        : layers.sol.trend === "down"
          ? "colder local air and thicker fog"
          : "steady local air with light mist"
    parts.push(
      `SOL (local fog): ${layers.sol.priceChangePercent >= 0 ? "+" : ""}${layers.sol.priceChangePercent.toFixed(1)}% (${intervalLabel}), ${localMood}, ${layers.sol.trend}.`
    )
  }

  return parts.join(" ")
}
