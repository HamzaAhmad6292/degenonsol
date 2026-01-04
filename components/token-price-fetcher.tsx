"use client"

import { useEffect, useState, useRef } from "react"

const TOKEN_ADDRESS = "4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"

export interface TokenPrice {
  price: number
  priceChange: "up" | "down" | "same"
  previousPrice: number
  priceChanges: {
    m5: number
    h1: number
    h6: number
    h24: number
  }
}

export function useTokenPrice(intervalMs: number = 10000) {
  const [priceData, setPriceData] = useState<TokenPrice>({
    price: 0,
    priceChange: "same",
    previousPrice: 0,
    priceChanges: { m5: 0, h1: 0, h6: 0, h24: 0 },
  })
  const [loading, setLoading] = useState(true)
  const previousPriceRef = useRef<number>(0)

  const fetchPrice = async () => {
    try {
      // Using DexScreener API for Solana token price
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`
      )
      const data = await response.json()
      
      if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs[0]
        const currentPrice = parseFloat(pair.priceUsd || "0")
        let priceChange: "up" | "down" | "same" = "same"
        let previousPrice = previousPriceRef.current

        // Check for initial load
        const isFirstLoad = previousPrice === 0
        
        if (isFirstLoad) {
          previousPriceRef.current = currentPrice
          previousPrice = currentPrice
          
          // On first load, use the 5-minute price change from API to determine trend
          const m5Change = pair.priceChange?.m5 || 0
          if (m5Change > 0) priceChange = "up"
          else if (m5Change < 0) priceChange = "down"
        } else {
          const percentChange = ((currentPrice - previousPrice) / previousPrice) * 100
          const threshold = 0.1 // 0.1% threshold

          if (Math.abs(percentChange) >= threshold) {
            if (currentPrice > previousPrice) {
              priceChange = "up"
            } else {
              priceChange = "down"
            }
            // Update ref only when threshold crossed to avoid flickering
            previousPriceRef.current = currentPrice
          }
        }

        setPriceData({
          price: currentPrice,
          priceChange,
          previousPrice,
          priceChanges: pair.priceChange || { m5: 0, h1: 0, h6: 0, h24: 0 },
        })
        setLoading(false)
      }
    } catch (error) {
      console.error("Error fetching token price:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrice() // Initial fetch
    const interval = setInterval(fetchPrice, intervalMs)
    return () => clearInterval(interval)
  }, [intervalMs])

  return { priceData, loading, refetch: fetchPrice }
}

