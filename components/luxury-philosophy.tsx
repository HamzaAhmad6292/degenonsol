"use client"

import { motion, useScroll, useTransform } from "framer-motion"

export function LuxuryPhilosophy() {
  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, -50])

  return (
    <section className="relative py-32 px-4 overflow-hidden z-20">
      {/* Background Texture */}
      <motion.div 
        style={{ y }}
        className="absolute inset-0 z-0"
      >
        <img 
          src="/philosophy-bg.png" 
          alt="Luxury Texture" 
          className="w-full h-[120%] object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-black/60" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto text-center relative z-10"
      >
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
                delayChildren: 0.1
              }
            }
          }}
        >
          <motion.h2 
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
            }}
            className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-6 md:mb-8 leading-tight drop-shadow-lg"
          >
            Reconnect with <br />
            <span className="text-primary italic">The Degen Spirit.</span>
          </motion.h2>
          
          <motion.div 
            variants={{
              hidden: { scaleX: 0 },
              visible: { scaleX: 1, transition: { duration: 0.8, ease: "circOut" } }
            }}
            className="h-[1px] w-16 md:w-24 bg-primary/50 mx-auto mb-8 md:mb-10" 
          />

          <motion.p 
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
            }}
            className="text-base md:text-lg lg:text-xl text-gray-300 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-md px-4"
          >
            An hour and a half drive from reality is all it takes to get you to this digital haven. 
            $DEGEN is all about luxury aesthetics and is the perfect sanctuary with a soul.
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  )
}
