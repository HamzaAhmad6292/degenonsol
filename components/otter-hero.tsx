"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Copy, Check, ExternalLink, TrendingUp } from "lucide-react"

export function OtterHero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollY } = useScroll()
  const [copied, setCopied] = useState(false)
  
  // Parallax effects
  const bgY = useTransform(scrollY, [0, 1000], [0, 300]) // Background moves slow
  const otterY = useTransform(scrollY, [0, 1000], [0, 100]) // Otter moves faster (closer)
  const textY = useTransform(scrollY, [0, 1000], [0, -200]) // Text moves opposite

  const copyToClipboard = () => {
    navigator.clipboard.writeText("So11111111111111111111111111111111111111112") // Example SOL address
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section ref={containerRef} className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[#051F20]">
      {/* Parallax Layer 1: Deep Jungle Background */}
      <motion.div 
        style={{ y: bgY, scale: 1.1 }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-[url('/jungle-bg.png')] bg-cover bg-center opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#051F20] via-[#051F20]/50 to-transparent" />
      </motion.div>

      {/* Parallax Layer 2: Otter Overlay (Mid-ground) */}
      <motion.div 
        style={{ y: otterY }}
        className="absolute inset-0 z-10 mix-blend-overlay opacity-40"
      >
         <div className="absolute inset-0 bg-[url('/otter-car-window.png')] bg-cover bg-center" />
      </motion.div>

      {/* Floating Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -1000], 
              opacity: [0, 0.8, 0],
              scale: [0.5, 1.5, 0.5]
            }}
            transition={{ 
              duration: 10 + Math.random() * 15, 
              repeat: Infinity, 
              delay: Math.random() * 5,
              ease: "linear"
            }}
            className="absolute bottom-0 w-1 h-1 md:w-2 md:h-2 rounded-full bg-[#D4A373] blur-[2px]"
            style={{ left: `${Math.random() * 100}%` }}
          />
        ))}
      </div>

      {/* Marquee Top */}
      <div className="absolute top-24 w-full overflow-hidden bg-[#52B788] py-2 z-30 transform -rotate-2 scale-105 shadow-lg border-y-4 border-[#051F20]">
        <motion.div 
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="flex whitespace-nowrap gap-8 text-[#051F20] font-black text-lg uppercase tracking-widest"
        >
          {[...Array(10)].map((_, i) => (
            <span key={i} className="flex items-center gap-2">
              <TrendingUp size={20} /> $DEGEN on SOL • JUNGLE VIBES • TIKTOK VIRAL •
            </span>
          ))}
        </motion.div>
      </div>

      {/* Live TikTok Stats Overlay */}
      <motion.div 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 1, type: "spring" }}
        className="absolute top-32 right-4 md:right-12 z-40 flex flex-col items-end hidden md:flex"
      >
        <div className="relative">
          <motion.img 
            src="/otter-mascot.png" 
            alt="Degen Mascot"
            animate={{ 
              y: [0, -15, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl z-10 relative"
          />
          
          {/* Speech Bubble / Stat Card */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="absolute top-10 right-28 bg-white/95 backdrop-blur-xl p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-[#69C9D0] min-w-[180px] transform -rotate-6"
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[#FE2C55] animate-pulse" />
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">New Followers</span>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-[#051F20] tracking-tighter">+8.6M</span>
              <span className="text-sm font-bold text-[#52B788] mb-1">Today 🚀</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        style={{ y: textY }}
        className="relative z-20 container mx-auto px-4 text-center mt-20"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mb-6"
        >
          <div className="inline-block bg-[#000000] text-white px-4 py-1 rounded-full text-sm font-bold mb-4 border border-[#52B788] animate-bounce">
            @marcelldegen PRESENTS
          </div>
          <h1 className="text-8xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-[#D4A373] to-[#E07A5F] drop-shadow-[0_10px_0_rgba(0,0,0,0.5)] leading-none transform -rotate-2">
            $DEGEN
          </h1>
          <div className="text-4xl md:text-6xl font-black text-white stroke-black drop-shadow-xl -mt-4 md:-mt-8 transform rotate-1">
            THE TIKTOK OTTER
          </div>
        </motion.div>

        <p className="text-xl md:text-2xl text-[#95D5B2] font-bold mb-10 max-w-2xl mx-auto">
          The first otter on Solana. 100% Organic. 100% Degen.
          <br />
          <span className="text-white opacity-80 text-lg font-normal">Join the viral movement</span>
        </p>

        {/* CA Box */}
        <div 
          onClick={copyToClipboard}
          className="mx-auto max-w-lg bg-[#051F20]/80 border-2 border-[#52B788] rounded-xl p-4 mb-10 cursor-pointer hover:bg-[#051F20] transition-all group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[#52B788]/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
          <div className="flex items-center justify-between gap-4 relative z-10">
            <div className="text-left">
              <div className="text-[#52B788] text-xs font-bold uppercase">Solana Contract Address</div>
              <div className="text-white font-mono text-sm md:text-lg truncate">So11111111111111111111111111111111111111112</div>
            </div>
            {copied ? <Check className="text-green-500" /> : <Copy className="text-[#52B788]" />}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <Button 
            className="bg-[#D4A373] hover:bg-[#E07A5F] text-[#051F20] font-black text-2xl px-12 py-8 rounded-2xl shadow-[0_10px_0_#8D6E63] hover:shadow-[0_5px_0_#8D6E63] hover:translate-y-[5px] transition-all"
          >
            BUY ON RAYDIUM
          </Button>
          <Button 
            className="bg-[#52B788] hover:bg-[#2D6A4F] text-[#051F20] font-black text-2xl px-12 py-8 rounded-2xl shadow-[0_10px_0_#1B4332] hover:shadow-[0_5px_0_#1B4332] hover:translate-y-[5px] transition-all"
          >
            DEXSCREENER <ExternalLink className="ml-2 w-6 h-6" />
          </Button>
        </div>
      </motion.div>
    </section>
  )
}
