"use client"

import { Twitter, Video, Leaf } from "lucide-react"
import { motion } from "framer-motion"

export function Footer() {
  return (
    <footer className="py-12 border-t border-[#D7CCC8] bg-[#F9F7F2] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="flex items-center gap-2 text-3xl font-black text-[#3E2723] mb-4">
              <Leaf className="w-8 h-8 text-[#69C9D0]" />
              $degen
            </h3>
            <p className="text-[#8D6E63] leading-relaxed font-medium">
              "The First Otter to Play TikTok"
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="text-lg font-bold text-[#3E2723] mb-4">Lifestyle</h4>
            <ul className="space-y-2">
              {["Story", "Gallery", "Merch"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-[#8D6E63] hover:text-[#69C9D0] transition-colors font-medium">
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
            <h4 className="text-lg font-bold text-[#3E2723] mb-4">Follow the Journey</h4>
            <div className="flex gap-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-[#1DA1F2] hover:bg-[#1DA1F2]/80 flex items-center justify-center transition-all shadow-md"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6 text-white" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 rounded-full bg-black hover:bg-black/80 flex items-center justify-center transition-all shadow-md"
                aria-label="TikTok"
              >
                <Video className="w-6 h-6 text-white" />
              </motion.a>
            </div>
          </motion.div>
        </div>

        {/* Animated Mascot & Disclaimer */}
        <div className="border-t border-[#D7CCC8] pt-8 text-center">
          <p className="text-sm text-[#8D6E63] mb-2 font-medium">
            {"© 2025 $degen. All rights reserved."}
          </p>
          <p className="text-xs text-[#8D6E63]/60 italic">
            {
              "Disclaimer: This is a meme token. We're just here for the vibes and the otter."
            }
          </p>
        </div>
      </div>
    </footer>
  )
}
