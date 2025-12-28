"use client";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Sparkles, CheckCircle, Leaf } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function HeroSection() {
  const followerCount = 8600000;
  const [copied, setCopied] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Content Container */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 flex justify-center"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:bg-white/20 transition-all cursor-default">
              <span className="w-2 h-2 rounded-full bg-[#52B788] animate-pulse shadow-[0_0_10px_#52B788]" />
              <span className="text-sm md:text-base font-bold text-[#F2E9E4] tracking-wide">@marcelldegen</span>
            </div>
          </motion.div>

          {/* Main Title */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 relative"
          >
            <h1 className="text-8xl md:text-[10rem] font-black mb-2 leading-none tracking-tighter drop-shadow-2xl">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-[#D4A373] to-[#E07A5F]">
                $degen
              </span>
            </h1>
            {/* Decorative Leaves */}
            <motion.div 
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-4 -right-4 md:top-0 md:right-20 text-[#2D6A4F] opacity-80"
            >
              <Leaf className="w-12 h-12 md:w-20 md:h-20 fill-current" />
            </motion.div>
          </motion.div>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-3xl md:text-5xl font-bold text-[#F2E9E4] mb-6 text-balance drop-shadow-md"
          >
            The Most Authentic <span className="text-[#52B788]">TikTok</span> Crypto Token
          </motion.p>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="text-lg md:text-xl text-[#95D5B2] max-w-2xl mx-auto text-pretty leading-relaxed mb-10 font-medium"
          >
            Join the movement where nature meets degens. Built by the community, for the community.
          </motion.p>

          {/* Follower Counter */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="flex items-center justify-center gap-3 mb-10 text-[#D4A373] bg-black/20 backdrop-blur-sm py-2 px-6 rounded-2xl inline-flex mx-auto border border-white/5"
          >
            <Users className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">
              {followerCount.toLocaleString()} <span className="font-normal opacity-80">Followers</span>
            </span>
            <TrendingUp className="w-6 h-6" />
          </motion.div>

          {/* Mascot */}
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 100 }}
            className="relative inline-block mb-12"
          >
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <img
                src="/otter-mascot.png"
                alt="$degen mascot"
                className="w-48 md:w-72 mx-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-105 transition-transform duration-300"
              />
            </motion.div>
            {/* Glow behind mascot */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#D4A373]/20 rounded-full blur-3xl -z-10" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-6 justify-center mb-16"
          >
            <Button
              size="lg"
              className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold text-xl px-10 py-8 rounded-2xl shadow-[0_10px_30px_rgba(45,106,79,0.4)] hover:shadow-[0_15px_40px_rgba(45,106,79,0.6)] hover:-translate-y-1 transition-all duration-300 border border-[#52B788]/30"
            >
              <Leaf className="w-6 h-6 mr-3" />
              Join the Jungle
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-[#D4A373] text-[#D4A373] hover:bg-[#D4A373] hover:text-[#051F20] font-bold text-xl px-10 py-8 rounded-2xl bg-transparent hover:-translate-y-1 transition-all duration-300 backdrop-blur-sm"
            >
              Watch on TikTok
            </Button>
          </motion.div>

          {/* Contract Address */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className="mb-12"
          >
            <div className="inline-flex flex-col items-center">
              <p className="text-sm text-[#95D5B2] mb-3 font-bold uppercase tracking-widest">
                Contract Address
              </p>
              <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 rounded-2xl p-3 pl-6 hover:border-[#52B788]/50 transition-all group shadow-lg">
                <code className="text-sm md:text-base font-mono text-[#F2E9E4]/90">
                  0x1234567890abcdef1234567890abcdef12345678
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl hover:bg-[#52B788] hover:text-white transition-all text-[#52B788]"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "0x1234567890abcdef1234567890abcdef12345678"
                    );
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 border-2 border-[#95D5B2]/50 rounded-full flex justify-center"
        >
          <motion.div 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-[#95D5B2] rounded-full mt-2" 
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
