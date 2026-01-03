"use client"

import { useEffect, useState, useMemo } from "react"
import { motion } from "framer-motion"

interface PricePoint {
  price: number
  time: number
}

interface TokenLineChartProps {
  data: PricePoint[]
  isPositive: boolean
  className?: string
}

export function TokenLineChart({ data, isPositive, className }: TokenLineChartProps) {
  const [animationProgress, setAnimationProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(true)

  // Colors based on trend
  const lineColor = isPositive ? "#22c55e" : "#ef4444"
  const glowColor = isPositive ? "rgba(34, 197, 94, 0.6)" : "rgba(239, 68, 68, 0.6)"
  const gradientStart = isPositive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"
  const gradientEnd = isPositive ? "rgba(34, 197, 94, 0)" : "rgba(239, 68, 68, 0)"

  // Generate smooth path from data points
  const { linePath, areaPath, points } = useMemo(() => {
    if (data.length < 2) return { linePath: "", areaPath: "", points: [] }

    const maxPrice = Math.max(...data.map(d => d.price))
    const minPrice = Math.min(...data.map(d => d.price))
    const priceRange = maxPrice - minPrice || maxPrice * 0.01 || 0.0001
    
    // Add 10% padding
    const paddedMin = minPrice - priceRange * 0.1
    const paddedRange = priceRange * 1.2

    const chartPoints = data.map((point, index) => ({
      x: (index / (data.length - 1)) * 100,
      y: 100 - ((point.price - paddedMin) / paddedRange * 80) - 10, // 10-90 range
      price: point.price,
    }))

    // Create smooth cubic bezier curve
    let pathD = `M ${chartPoints[0].x} ${chartPoints[0].y}`
    
    for (let i = 1; i < chartPoints.length; i++) {
      const prev = chartPoints[i - 1]
      const curr = chartPoints[i]
      const next = chartPoints[i + 1] || curr
      
      // Control points for smooth curve
      const tensionFactor = 0.25
      const cp1x = prev.x + (curr.x - (chartPoints[i - 2]?.x || prev.x)) * tensionFactor
      const cp1y = prev.y + (curr.y - (chartPoints[i - 2]?.y || prev.y)) * tensionFactor
      const cp2x = curr.x - (next.x - prev.x) * tensionFactor
      const cp2y = curr.y - (next.y - prev.y) * tensionFactor
      
      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`
    }

    // Area path for gradient fill
    const lastPoint = chartPoints[chartPoints.length - 1]
    const areaPathD = pathD + ` L ${lastPoint.x} 100 L ${chartPoints[0].x} 100 Z`

    return { linePath: pathD, areaPath: areaPathD, points: chartPoints }
  }, [data])

  // Animate on data change
  useEffect(() => {
    setAnimationProgress(0)
    setIsAnimating(true)
    const timer = setTimeout(() => {
      setAnimationProgress(1)
      setIsAnimating(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [data])

  if (!linePath || points.length < 2) return null

  // Unique IDs for gradients
  const gradientId = `lineGradient-${isPositive ? 'up' : 'down'}`
  const areaGradientId = `areaGradient-${isPositive ? 'up' : 'down'}`
  const glowId = `glowFilter-${isPositive ? 'up' : 'down'}`

  return (
    <div 
      className={`absolute inset-0 ${className || ""}`} 
      style={{ 
        zIndex: 1, 
        padding: "5%",
        pointerEvents: "none",
      }}
    >
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none"
        style={{ overflow: "visible" }}
      >
        <defs>
          {/* Glow filter */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Line gradient */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.6"/>
            <stop offset="50%" stopColor={lineColor} stopOpacity="1"/>
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.8"/>
          </linearGradient>
          
          {/* Area fill gradient */}
          <linearGradient id={areaGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={gradientStart}/>
            <stop offset="60%" stopColor={gradientEnd}/>
            <stop offset="100%" stopColor="transparent"/>
          </linearGradient>
        </defs>

        {/* Area fill with animation */}
        <motion.path
          d={areaPath}
          fill={`url(#${areaGradientId})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />

        {/* Animated line with drawing effect */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ 
            pathLength: { duration: 2, ease: "easeInOut" },
            opacity: { duration: 0.5 }
          }}
        />

        {/* Glowing overlay line */}
        <motion.path
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth="0.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 0 4px ${glowColor})` }}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.8 }}
          transition={{ 
            pathLength: { duration: 2, ease: "easeInOut", delay: 0.1 },
            opacity: { duration: 0.5, delay: 0.1 }
          }}
        />

        {/* Animated dot at the end of the line */}
        {points.length > 0 && (
          <>
            {/* Pulsing glow effect */}
            <motion.circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="1.5"
              fill={lineColor}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: [0.3, 0.6, 0.3],
                scale: [1, 1.8, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                delay: 2,
                ease: "easeInOut"
              }}
              style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}
            />
            {/* Main dot */}
            <motion.circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r="0.8"
              fill={lineColor}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 1.8 }}
              style={{ filter: `drop-shadow(0 0 3px ${glowColor})` }}
            />
          </>
        )}

        {/* Subtle grid lines for depth */}
        {[20, 40, 60, 80].map((y, i) => (
          <motion.line
            key={`grid-${i}`}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke={isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)"}
            strokeWidth="0.1"
            strokeDasharray="2,4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 1, delay: i * 0.2 }}
          />
        ))}
      </svg>

      {/* Animated particles along the line (optional subtle effect) */}
      <div className="absolute inset-0 overflow-hidden">
        {points.slice(-5).map((point, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              background: lineColor,
              boxShadow: `0 0 8px ${glowColor}`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0.5],
              y: [0, isPositive ? -20 : 20],
            }}
            transition={{
              duration: 3,
              delay: 2 + i * 0.3,
              repeat: Infinity,
              repeatDelay: 5,
            }}
          />
        ))}
      </div>
    </div>
  )
}
