"use client"

import { motion } from "framer-motion"

export function BackgroundAnimation() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: ["0%", "10%", "0%"],
          y: ["0%", "5%", "0%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -120, 0],
          x: ["0%", "-15%", "0%"],
          y: ["0%", "10%", "0%"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-accent/5 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 180, 0],
          x: ["0%", "5%", "0%"],
          y: ["0%", "-10%", "0%"],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[10%] left-[20%] w-[45%] h-[45%] bg-secondary/5 rounded-full blur-[130px]"
      />
    </div>
  )
}
