"use client"

import { Twitter, Video } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-card/50 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-black text-primary mb-4">$degen</h3>
            <p className="text-muted-foreground leading-relaxed">
              {"The most authentic TikTok crypto token. Join the movement."}
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-bold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Buy $degen", "Tokenomics", "Community"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <h4 className="text-lg font-bold text-foreground mb-4">Join the Degens</h4>
            <div className="flex gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-chart-4 hover:bg-chart-4/80 flex items-center justify-center transition-all"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6 text-white" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center transition-all"
                aria-label="TikTok"
              >
                <Video className="w-6 h-6 text-white" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Animated Mascot & Disclaimer */}
        <div className="border-t border-border pt-8 text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mb-4"
          >
            <motion.img 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              src="/otter-mascot.png" 
              alt="Degen mascot" 
              className="w-16 h-16 mx-auto drop-shadow-lg" 
            />
          </motion.div>
          <p className="text-sm text-muted-foreground mb-2">
            {"© 2025 $degen. All rights reserved. Built with ❤️ by the community."}
          </p>
          <p className="text-xs text-muted-foreground italic">
            {
              "Disclaimer: $degen is a meme token. Do your own research. Not financial advice. We're just here for the vibes."
            }
          </p>
        </div>
      </div>
    </footer>
  )
}
