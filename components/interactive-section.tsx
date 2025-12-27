"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function InteractiveSection() {
  const [fortune, setFortune] = useState<string | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)

  const fortunes = [
    "🚀 Your bags will moon harder than a SpaceX launch",
    "💎 Diamond hands detected. Massive gains incoming.",
    "🔮 The charts speak: HODL and prosper, young degen",
    "⚡ Lightning will strike your wallet... with profits",
    "🌙 Moon mission approved. Buckle up, degen",
    "🎯 Your next trade? Chef's kiss. Trust the vibe.",
    "🏆 Legend status unlocked. You're built different.",
    "🔥 Your portfolio is about to be absolutely fire",
    "✨ The degen gods smile upon you today",
    "💰 Generational wealth incoming. Stay degen.",
  ]

  const generateFortune = () => {
    setIsAnimating(true)
    setTimeout(() => {
      const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)]
      setFortune(randomFortune)
      setIsAnimating(false)

      // Confetti effect
      if (typeof window !== "undefined") {
        createConfetti()
      }
    }, 1000)
  }

  const createConfetti = () => {
    const confettiCount = 50
    const colors = ["#0F6157", "#FFD166", "#FF4DA6", "#00D9FF"]

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement("div")
      confetti.style.position = "fixed"
      confetti.style.left = Math.random() * 100 + "%"
      confetti.style.top = "-10px"
      confetti.style.width = "10px"
      confetti.style.height = "10px"
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0"
      confetti.style.pointerEvents = "none"
      confetti.style.zIndex = "100"
      confetti.style.animation = `fall ${2 + Math.random() * 2}s linear`

      document.body.appendChild(confetti)

      setTimeout(() => {
        confetti.remove()
      }, 4000)
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>

      <section className="py-24 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,77,166,0.05),transparent)] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-6 text-balance">
              <span className="text-secondary">Degen</span> <span className="text-foreground">Fortune</span>{" "}
              <span className="text-accent">Teller</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty leading-relaxed">
              {"What does the future hold for you, degen? Click to reveal your crypto destiny."}
            </p>
          </motion.div>

          {/* Fortune Generator */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto mb-20"
          >
            <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border-2 border-primary text-center shadow-[0_0_50px_rgba(15,97,87,0.1)]">
              <div className="mb-8">
                <motion.div 
                  animate={isAnimating ? { rotate: 360 } : { rotate: 0 }}
                  transition={isAnimating ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.5 }}
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center shadow-inner"
                >
                  <Sparkles className="w-12 h-12 text-primary" />
                </motion.div>

                <AnimatePresence mode="wait">
                  {fortune ? (
                    <motion.p 
                      key={fortune}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-balance"
                    >
                      {fortune}
                    </motion.p>
                  ) : (
                    <motion.p 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-2xl md:text-3xl font-bold text-muted-foreground mb-6 text-balance"
                    >
                      {"Your fortune awaits..."}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <Button
                size="lg"
                onClick={generateFortune}
                disabled={isAnimating}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-2xl disabled:opacity-50 shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                {isAnimating ? "Consulting the Degen Gods..." : "Get Your Fortune"}
              </Button>
            </Card>
          </motion.div>
        </div>
      </section>
    </>
  )
}
