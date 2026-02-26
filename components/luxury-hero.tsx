"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { ArrowDown, MessageCircle, Sparkles } from "lucide-react"

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
          {/* AI badge — so visitors know there's an AI */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mb-4 flex flex-wrap items-center justify-center gap-2 md:gap-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/40 text-primary text-[10px] md:text-xs font-semibold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              AI otter
            </span>
            <span className="text-white/70 text-xs md:text-sm">
              Reads the chart · Has opinions · Talks back
            </span>
          </motion.div>

          <span className="text-primary text-[10px] md:text-sm tracking-[0.4em] uppercase mb-2 block drop-shadow-md">
            The First Otter to break Tiktok
          </span>
          <h1 className="font-serif text-5xl md:text-7xl lg:text-9xl text-white mb-3 leading-tight drop-shadow-2xl">
            Join <span className="text-primary italic">$DEGEN</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-xl mx-auto mb-10 drop-shadow-md">
            Meet the AI that reacts to price in real time. No boring docs — just vibes.
          </p>

          {/* Primary CTA: Talk to Degen — reason to click */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.8 }}
            className="flex flex-col items-center gap-4 mb-8"
          >
            <a
              href="/chat"
              className="group w-full sm:w-auto px-10 md:px-14 py-5 bg-primary text-black font-bold rounded-full hover:bg-primary/90 transition-all duration-300 shadow-[0_0_40px_rgba(212,175,55,0.4)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)] hover:scale-105 flex items-center justify-center gap-3 text-base md:text-lg"
            >
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
              Talk to Degen
              <span className="opacity-80 group-hover:opacity-100">→</span>
            </a>
            <p className="text-white/60 text-sm max-w-sm">
              Ask about the chart, the weather, or just say gm. The otter actually answers.
            </p>
          </motion.div>

          {/* Secondary: token + market */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-6">
            <a
              href="https://dexscreener.com/solana/4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 md:px-10 py-3 border border-white/25 text-white/90 font-medium rounded-full hover:bg-white/10 transition-all duration-300 text-sm"
            >
              Explore $DEGEN
            </a>
            <a
              href="https://dexscreener.com/solana/4Nc2EhF8vqXcjHpbUevYZv9Bv4aKb4fWi7cju7c2pump"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 md:px-10 py-3 border border-white/25 text-white/90 font-medium rounded-full hover:bg-white/10 transition-all duration-300 text-sm"
            >
              Market Data
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
