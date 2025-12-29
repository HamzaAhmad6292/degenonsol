"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
      
      // Check if hovering over clickable element
      const target = e.target as HTMLElement
      setIsPointer(
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName === "BUTTON" ||
        target.tagName === "A"
      )
    }

    window.addEventListener("mousemove", updateMousePosition)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
    }
  }, [])

  return (
    <>
      {/* Main Cursor Dot */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 bg-primary rounded-full pointer-events-none z-[100] mix-blend-difference"
        animate={{
          x: mousePosition.x - 4,
          y: mousePosition.y - 4,
          scale: isPointer ? 0 : 1
        }}
        transition={{
          type: "spring",
          damping: 30,
          stiffness: 400,
          mass: 0.2
        }}
      />
      
      {/* Following Ring */}
      <motion.div
        className="fixed top-0 left-0 w-16 h-16 border-[3px] border-primary rounded-full pointer-events-none z-[100] mix-blend-difference"
        animate={{
          x: mousePosition.x - 32,
          y: mousePosition.y - 32,
          scale: isPointer ? 1.3 : 1,
          opacity: isPointer ? 1 : 0.7
        }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 200,
          mass: 0.4
        }}
      >
        <div className="absolute inset-0 bg-primary/30 rounded-full blur-[6px]" />
      </motion.div>
    </>
  )
}
