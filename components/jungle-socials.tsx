"use client"

import { motion } from "framer-motion"
import { Twitter, Send, Video, Leaf } from "lucide-react"
import { Button } from "@/components/ui/button"

export function JungleSocials() {
  const socials = [
    {
      name: "TikTok",
      icon: Video,
      handle: "@marcelldegen",
      color: "bg-black",
      hover: "hover:bg-[#FE2C55]",
      desc: "Watch the viral moments",
      link: "#"
    },
    {
      name: "Twitter",
      icon: Twitter,
      handle: "@degenotter",
      color: "bg-[#1DA1F2]",
      hover: "hover:bg-[#0c85d0]",
      desc: "Latest updates & memes",
      link: "#"
    }
  ]

  return (
    <section className="py-32 relative overflow-hidden bg-[#051F20]">
      {/* Deep Jungle Background Layers */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1596323676766-999999999999?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#051F20] via-[#051F20]/90 to-[#051F20]" />
      
      {/* Hanging Vines Animation */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: ["20%", "40%", "20%"] }}
            transition={{ duration: 5 + Math.random() * 5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 w-1 bg-[#2D6A4F]/40 rounded-b-full"
            style={{ left: `${i * 10 + Math.random() * 5}%` }}
          >
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#2D6A4F] rounded-full blur-sm" />
          </motion.div>
        ))}
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#2D6A4F]/20 border border-[#52B788]/30 mb-6"
          >
            <Leaf className="w-5 h-5 text-[#52B788]" />
            <span className="text-[#95D5B2] font-bold tracking-widest uppercase">The Tribe</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-black text-[#F2E9E4] mb-6 drop-shadow-2xl">
            JOIN THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#52B788] to-[#D4A373]">JUNGLE</span>
          </h2>
          <p className="text-xl text-[#95D5B2] max-w-2xl mx-auto font-medium">
            We are not just a community. We are a habitat. Come vibe with us.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {socials.map((social, index) => (
            <motion.div
              key={social.name}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="relative group"
            >
              {/* Card Container - "Wooden/Stone" Tablet Look */}
              <div className="h-full bg-[#0B2B26] border-2 border-[#1B4332] rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group-hover:border-[#52B788] transition-colors duration-300">
                {/* Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#52B788]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Icon */}
                <div className={`w-20 h-20 rounded-2xl ${social.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <social.icon className="w-10 h-10 text-white" />
                </div>

                <h3 className="text-2xl font-black text-[#F2E9E4] mb-2">{social.name}</h3>
                <p className="text-[#52B788] font-bold mb-4">{social.handle}</p>
                <p className="text-[#95D5B2] mb-8">{social.desc}</p>

                <Button className="w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold rounded-xl py-6 mt-auto border border-[#52B788]/20 group-hover:bg-[#52B788] group-hover:text-[#051F20] transition-all">
                  Connect
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
