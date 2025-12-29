"use client"

import { motion, useScroll, useTransform } from "framer-motion"

export function LuxuryHabitat() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden z-20 py-20 md:py-0">
      {/* Split Layout Background */}
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-2">
        <div className="bg-[#0F1F12] relative">
           {/* Texture Overlay */}
           <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
        <div className="relative h-[50vh] md:h-full">
          <motion.div 
            style={{ y }}
            className="absolute inset-0 h-[120%] -top-[10%]"
          >
            <img 
              src="/habitat-bg.png" 
              alt="Luxury Habitat" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="container mx-auto px-6 relative z-10"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Text Side */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.2
                }
              }
            }}
            className="text-center md:text-left md:pl-12 bg-[#0F1F12]/80 md:bg-transparent p-8 md:p-0 rounded-3xl backdrop-blur-sm md:backdrop-blur-none"
          >
            <motion.span 
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6 } }
              }}
              className="text-primary text-[10px] md:text-sm tracking-[0.3em] uppercase mb-4 block"
            >
              The Habitat
            </motion.span>
            
            <motion.h2 
              variants={{
                hidden: { opacity: 0, x: -30 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight"
            >
              A Sanctuary <br />
              <span className="italic text-white/80">For Degens</span>
            </motion.h2>
            
            <motion.p 
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
              }}
              className="text-gray-400 font-light text-base md:text-lg leading-relaxed mb-8 max-w-md mx-auto md:mx-0"
            >
              Immerse yourself in a world where viral culture meets high-end living. 
              Our habitat is designed for those who appreciate the finer things in the meme economy.
            </motion.p>
            
            <motion.button 
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
              }}
              className="px-8 py-3 border border-primary/30 text-primary hover:bg-primary hover:text-black transition-all duration-300 rounded-full uppercase tracking-widest text-[10px]"
            >
              Explore The Den
            </motion.button>
          </motion.div>

          {/* Image Side (Empty as bg handles it, but we can add a floating element if needed) */}
          <div className="h-[30vh] md:hidden" />
        </div>
      </motion.div>
    </section>
  )
}
