"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Users, LineChart, Music } from "lucide-react"

const XIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
  </svg>
)

const DexscreenerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
)

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="w-full h-full fill-current">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.13-1.47-.76-.54-1.43-1.23-1.93-2.02V15.5c0 1.61-.46 3.23-1.53 4.43-1.14 1.32-2.86 2.1-4.58 2.06-1.93.03-3.85-.93-4.99-2.49-1.15-1.54-1.44-3.62-.81-5.39.54-1.62 1.92-2.95 3.55-3.43 1.05-.31 2.15-.32 3.23-.14V14.6c-.7-.2-1.48-.23-2.19-.06-1.02.23-1.93.94-2.34 1.91-.43 1.03-.36 2.27.24 3.2.6.93 1.64 1.51 2.73 1.48 1.14.04 2.25-.54 2.84-1.52.46-.75.65-1.64.63-2.51V.02z"></path>
  </svg>
)

export function LuxurySocials() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])

  const socials = [
    {
      name: "X",
      icon: XIcon,
      href: "https://x.com/Marcelldegensol",
      color: "hover:text-white",
    },
    {
      name: "Community",
      icon: XIcon,
      href: "https://x.com/Marcelldegensol",
      color: "hover:text-white",
    },
    {
      name: "Dexscreener",
      icon: DexscreenerIcon,
      href: "https://dexscreener.com/solana/degen",
      color: "hover:text-white",
    },
    {
      name: "TikTok",
      icon: TikTokIcon,
      href: "https://tiktok.com/@marcelldegen",
      color: "hover:text-[#ff0050]",
    },
  ]

  return (
    <section className="py-20 px-4 relative overflow-hidden z-10">
      {/* Parallax Background with Blend */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <div className="absolute inset-0 bg-black/70 z-10" />
        <img 
          src="/socials-bg.png" 
          alt="Luxury Texture" 
          className="w-full h-[120%] object-cover"
        />
        {/* Gradient Mask */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-20" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 80 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl text-primary mb-12 drop-shadow-lg"
        >
          Join $DEGEN
        </motion.h2>

        <div className="flex flex-wrap justify-center gap-6 md:gap-16 px-4">
          {socials.map((social, index) => (
            <motion.a
              key={social.name}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group flex flex-col items-center gap-3 md:gap-4 text-muted-foreground transition-colors duration-300 ${social.color}`}
            >
              <div className="p-3 md:p-4 rounded-full border border-white/10 bg-white/5 group-hover:bg-white/10 group-hover:border-primary/50 transition-all duration-300 backdrop-blur-sm shadow-lg group-hover:shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <div className="w-6 h-6 md:w-8 md:h-8">
                  <social.icon />
                </div>
              </div>
              <span className="text-[10px] md:text-xs font-medium tracking-[0.2em] uppercase text-white/40 group-hover:text-white transition-all duration-300 transform translate-y-0">
                {social.name}
              </span>
            </motion.a>
          ))}
        </div>
      </motion.div>
    </section>
  )
}
