"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown } from "lucide-react"

export function LuxuryHero() {
  const { scrollY } = useScroll()
  const opacity = useTransform(scrollY, [0, 800], [1, 0])

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Fixed Parallax Background Image */}
      <motion.div
        style={{ opacity }}
        className="fixed inset-0 z-0"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#0F1F12] z-10" />
        <img
          src="/hero-bg-ai.png"
          alt="Cinematic Otter"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-[#0F1F12]/20 mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-64 bg-gradient-to-t from-[#0F1F12] to-transparent z-20" />
      </motion.div>

      {/* Content */}
      <div className="relative z-20 text-center px-6 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <span className="text-primary text-[10px] md:text-sm tracking-[0.4em] uppercase mb-4 block drop-shadow-md">
            The First Otter to break Tiktok
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl text-white mb-8 leading-tight drop-shadow-2xl">
            Join <span className="text-primary italic">$DEGEN</span>
          </h1>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-8">
            <a
              href="https://dexscreener.com/solana/4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 md:px-12 py-4 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all duration-300 shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 uppercase tracking-widest text-xs flex items-center justify-center"
            >
              Explore $DEGEN
            </a>
            <a
              href="https://dexscreener.com/solana/4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-8 md:px-12 py-4 border border-white/20 text-white font-bold rounded-full hover:bg-white/10 transition-all duration-300 backdrop-blur-md hover:scale-105 uppercase tracking-widest text-xs flex items-center justify-center"
            >
              Market Data
            </a>
            <a
              href="/chat"
              className="w-full sm:w-auto px-8 md:px-12 py-4 border border-primary/50 text-primary font-bold rounded-full hover:bg-primary/10 transition-all duration-300 backdrop-blur-md hover:scale-105 uppercase tracking-widest text-xs flex items-center justify-center"
            >
              Chat with Otter
            </a>
          </div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        style={{ opacity }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="flex flex-col items-center gap-2 text-white/70">
          <span className="text-[10px] uppercase tracking-widest drop-shadow-md">Explore</span>
          <ArrowDown className="w-4 h-4 animate-bounce drop-shadow-md" />
        </div>
      </motion.div>
    </section>
  )
}
