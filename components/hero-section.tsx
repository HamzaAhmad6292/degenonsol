"use client";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Sparkles, CheckCircle } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export function HeroSection() {
  const followerCount = 8600000;
  const [copied, setCopied] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" 
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.15, 0.1]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            x: [0, 30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-secondary/20 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Main Logo/Title */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm md:text-base font-bold text-primary tracking-wide">@marcelldegen</span>
            </motion.div>
            <h1 className="text-7xl md:text-9xl font-black mb-4 text-balance">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                $degen
              </span>
            </h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-2xl md:text-4xl font-bold text-foreground mb-4 text-balance"
            >
              The Most Authentic TikTok Crypto Token
            </motion.p>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed"
            >
              {
                "Join the movement where memes meet authenticity. Built by the community, for the community."
              }
            </motion.p>
          </motion.div>

          {/* Follower Counter */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="flex items-center justify-center gap-2 mb-8 text-accent"
          >
            <Users className="w-6 h-6" />
            <span className="text-xl font-bold">
              {followerCount.toLocaleString()} TikTok Followers
            </span>
            <TrendingUp className="w-6 h-6" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <Button
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg px-8 py-6 rounded-2xl shadow-[0_0_20px_rgba(15,97,87,0.3)] hover:shadow-[0_0_30px_rgba(15,97,87,0.5)] transition-all duration-300"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Join the Degens
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-2 border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-bold text-lg px-8 py-6 rounded-2xl bg-transparent transition-all duration-300"
            >
              Watch on TikTok
            </Button>
          </motion.div>

          {/* Contract Address */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mb-12"
          >
            <div className="inline-flex flex-col items-center">
              <p className="text-sm text-muted-foreground mb-2 font-bold uppercase tracking-widest">
                Contract Address
              </p>
              <div className="flex items-center gap-2 bg-background/50 backdrop-blur-md border-2 border-primary/20 rounded-2xl p-2 pl-6 hover:border-primary/50 transition-colors group">
                <code className="text-sm md:text-base font-mono text-foreground/80">
                  0x1234567890abcdef1234567890abcdef12345678
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  className="rounded-xl hover:bg-primary hover:text-primary-foreground transition-all"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "0x1234567890abcdef1234567890abcdef12345678"
                    );
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  }}
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Sparkles className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Floating Mascot */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.4, type: "spring" }}
            className="relative inline-block"
          >
            <motion.img
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              src="/otter-mascot.png"
              alt="$degen mascot"
              className="w-48 md:w-64 mx-auto drop-shadow-[0_20px_50px_rgba(15,97,87,0.3)]"
            />
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
          className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center"
        >
          <motion.div 
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-muted-foreground rounded-full mt-2" 
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
