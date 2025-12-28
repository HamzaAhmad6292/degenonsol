"use client"

import { motion } from "framer-motion"

export function JungleBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-[#051F20]">
      {/* Deep Jungle Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#051F20] via-[#0B2B26] to-[#051F20]" />

      {/* Sunlight filtering through canopy */}
      <motion.div
        initial={{ opacity: 0.3 }}
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/4 w-1/2 h-full bg-gradient-to-b from-[#D4A373]/20 to-transparent blur-3xl transform -skew-x-12"
      />

      {/* Organic Shapes / Leaves (CSS approximations) */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#2D6A4F]/20 rounded-full blur-3xl"
      />
      
      <motion.div
        animate={{
          y: [0, 30, 0],
          rotate: [0, -5, 0],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute top-1/4 -right-20 w-[30rem] h-[30rem] bg-[#1B4332]/30 rounded-full blur-3xl"
      />

      {/* Fireflies */}
      {[...Array(20)].map((_, i) => (
        <Firefly key={i} />
      ))}
      
      {/* Vignette Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#051F20_100%)] opacity-80" />
    </div>
  )
}

function Firefly() {
  const randomX = Math.random() * 100
  const randomY = Math.random() * 100
  const duration = 10 + Math.random() * 20
  const delay = Math.random() * 10

  return (
    <motion.div
      initial={{ x: `${randomX}vw`, y: `${randomY}vh`, opacity: 0 }}
      animate={{
        x: [`${randomX}vw`, `${randomX + (Math.random() * 20 - 10)}vw`, `${randomX}vw`],
        y: [`${randomY}vh`, `${randomY + (Math.random() * 20 - 10)}vh`, `${randomY}vh`],
        opacity: [0, 0.8, 0],
        scale: [0, 1.5, 0],
      }}
      transition={{
        duration: duration,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
      className="absolute w-1 h-1 bg-[#D4A373] rounded-full blur-[1px] shadow-[0_0_5px_#D4A373]"
    />
  )
}
