"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X, Video, Leaf } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "#lifestyle", label: "Lifestyle" },
    { href: "#story", label: "Story" },
    { href: "#community", label: "Community" },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-6 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300`}
    >
      <div 
        className={`w-full max-w-4xl transition-all duration-300 rounded-full ${
          isScrolled || isMobileMenuOpen
            ? "bg-[#051F20]/80 backdrop-blur-xl border border-[#52B788]/20 shadow-lg py-3 px-8" 
            : "bg-white/5 backdrop-blur-md border border-white/10 py-4 px-8"
        }`}
      >
        <div className="flex items-center justify-between">
          <motion.a 
            href="#" 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 text-2xl font-black transition-colors text-[#F2E9E4] hover:text-[#52B788]`}
          >
            <Leaf className="w-6 h-6 text-[#52B788]" />
            $degen
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.href}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -2 }}
                className={`font-bold text-sm uppercase tracking-wider transition-colors relative group text-[#F2E9E4] hover:text-[#52B788]`}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Button 
                size="sm"
                className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-bold rounded-full px-6 shadow-md border border-[#52B788]/30"
              >
                <Video className="w-4 h-4 mr-2" />
                TikTok
              </Button>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            className={`md:hidden p-2 rounded-full transition-colors text-[#F2E9E4] hover:bg-white/10`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden mt-4 pb-4 border-t border-[#52B788]/20 pt-4 overflow-hidden"
            >
              <div className="flex flex-col gap-4 text-center">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-[#F2E9E4] hover:text-[#52B788] transition-colors font-bold text-lg"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
