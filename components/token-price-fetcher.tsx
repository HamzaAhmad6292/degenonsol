"use client"

import { useEffect, useState, useRef } from "react"

const TOKEN_ADDRESS = "4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"

export interface TokenPrice {
  price: number
  priceChange: "up" | "down" | "same"
  previousPrice: number
}

export function useTokenPrice(intervalMs: number = 10000) {
  const [priceData, setPriceData] = useState<TokenPrice>({
    price: 0,
    priceChange: "same",
    previousPrice: 0,
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
        const previousPrice = previousPriceRef.current || currentPrice

        let priceChange: "up" | "down" | "same" = "same"
        if (currentPrice > previousPrice) {
          priceChange = "up"
        } else if (currentPrice < previousPrice) {
          priceChange = "down"
        }

        previousPriceRef.current = currentPrice

        setPriceData({
          price: currentPrice,
          priceChange,
          previousPrice,
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

