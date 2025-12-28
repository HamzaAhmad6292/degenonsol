"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Flame, Lock, Coins, Rocket } from "lucide-react"

export function OtterLifestyleGrid() {
  const tokenomics = [
    {
      title: "Total Supply",
      value: "1,000,000,000",
      sub: "$DEGEN",
      icon: Coins,
      color: "text-[#D4A373]",
      bg: "bg-[#D4A373]/10",
      border: "border-[#D4A373]/20"
    },
    {
      title: "Liquidity",
      value: "BURNED",
      sub: "Forever",
      icon: Flame,
      color: "text-[#E07A5F]",
      bg: "bg-[#E07A5F]/10",
      border: "border-[#E07A5F]/20"
    },
    {
      title: "Mint Authority",
      value: "REVOKED",
      sub: "Safe & Sound",
      icon: Lock,
      color: "text-[#52B788]",
      bg: "bg-[#52B788]/10",
      border: "border-[#52B788]/20"
    },
    {
      title: "Tax",
      value: "0/0",
      sub: "No BS",
      icon: Rocket,
      color: "text-[#69C9D0]",
      bg: "bg-[#69C9D0]/10",
      border: "border-[#69C9D0]/20"
    }
  ]

  return (
    <section className="py-24 bg-[#051F20] relative overflow-hidden">
      {/* Jungle Map Background Pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#52B788_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-5xl md:text-7xl font-black text-[#F2E9E4] mb-6 drop-shadow-lg">
            TOKENOMICS
          </h2>
          <p className="text-xl text-[#95D5B2] max-w-2xl mx-auto font-bold">
            The path to the moon is paved with $DEGEN.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tokenomics.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className={`h-full p-8 ${item.bg} backdrop-blur-md border-2 ${item.border} flex flex-col items-center text-center hover:scale-105 transition-transform duration-300`}>
                <div className={`p-4 rounded-full bg-[#051F20] ${item.color} mb-6 shadow-lg`}>
                  <item.icon size={40} />
                </div>
                <h3 className="text-[#F2E9E4] text-lg font-bold uppercase tracking-widest mb-2 opacity-80">{item.title}</h3>
                <div className={`text-3xl md:text-4xl font-black ${item.color} mb-2`}>{item.value}</div>
                <div className="text-[#95D5B2] font-medium">{item.sub}</div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Roadmap / Path */}
        <div className="mt-32 relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-[#52B788] to-transparent opacity-30 hidden md:block" />
          
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-[#F2E9E4]">JUNGLE ROADMAP</h2>
          </div>

          <div className="space-y-12 relative">
            {[
              { phase: "Phase 1", title: "The Awakening", desc: "Launch on Pump.fun, Raydium Listing, TikTok Takeover" },
              { phase: "Phase 2", title: "The Expansion", desc: "CEX Listings, 10k Holders, Otter Merch Store" },
              { phase: "Phase 3", title: "The Domination", desc: "Tier 1 Exchanges, Global Marketing, Otter Sanctuary Donation" }
            ].map((phase, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`flex flex-col md:flex-row items-center gap-8 ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                <div className="flex-1 text-center md:text-right">
                  {i % 2 !== 0 && (
                    <>
                      <div className="text-[#52B788] font-black text-xl mb-2">{phase.phase}</div>
                      <h3 className="text-3xl font-bold text-white mb-2">{phase.title}</h3>
                      <p className="text-[#95D5B2]">{phase.desc}</p>
                    </>
                  )}
                </div>
                
                <div className="w-8 h-8 rounded-full bg-[#52B788] border-4 border-[#051F20] z-10 shadow-[0_0_20px_#52B788]" />
                
                <div className="flex-1 text-center md:text-left">
                  {i % 2 === 0 && (
                    <>
                      <div className="text-[#52B788] font-black text-xl mb-2">{phase.phase}</div>
                      <h3 className="text-3xl font-bold text-white mb-2">{phase.title}</h3>
                      <p className="text-[#95D5B2]">{phase.desc}</p>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
