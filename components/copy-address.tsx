"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CopyAddress() {
  const [copied, setCopied] = useState(false)
  const address = "Coming Soon" // Placeholder CA

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <span className="text-white/50 text-sm uppercase tracking-widest">Contract Address</span>
      <button
        onClick={handleCopy}
        className="group relative flex items-center gap-3 px-4 md:px-6 py-2 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/50 rounded-full transition-all duration-300 backdrop-blur-md max-w-[90vw]"
      >
        <span className="font-mono text-primary text-sm md:text-lg truncate">{address}</span>
        <div className="relative">
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Check className="w-5 h-5 text-green-400" />
              </motion.div>
            ) : (
              <motion.div
                key="copy"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <Copy className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 shadow-[0_0_20px_rgba(212,175,55,0.1)] pointer-events-none" />
      </button>
    </div>
  )
}
