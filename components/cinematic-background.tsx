"use client"

import { motion } from "framer-motion"

export function CinematicBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      {/* Ambient Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Deep Jungle Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F1F12] via-[#1a1a1a] to-black opacity-90" />
        
        {/* Subtle Moving Glows */}
        <motion.div 
          animate={{ 
            opacity: [0.3, 0.5, 0.3], 
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary/10 rounded-full blur-[100px]"
        />
        <motion.div 
          animate={{ 
            opacity: [0.2, 0.4, 0.2], 
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-accent/5 rounded-full blur-[120px]"
        />
        
        {/* Grain Overlay for Cinematic Feel */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Gold Dust Particles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bg-[#D4AF37] rounded-full opacity-20"
              initial={{
                x: Math.random() * 100 + "vw",
                y: Math.random() * 100 + "vh",
                scale: Math.random() * 0.5 + 0.5,
              }}
              animate={{
                y: [null, Math.random() * -100 + "vh"],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: Math.random() * 20 + 10,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                width: Math.random() * 4 + 1 + "px",
                height: Math.random() * 4 + 1 + "px",
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
