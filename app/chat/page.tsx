"use client"

import { useState } from "react"
import { FullscreenOtterDisplay } from "@/components/fullscreen-otter-display"
import { SideChatBubbles } from "@/components/side-chat-bubbles"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { type Sentiment } from "@/lib/sentiment-analyzer"

export default function ChatPage() {
  const [chatSentiment, setChatSentiment] = useState<Sentiment | null>(null)

  return (
    <main className="fixed inset-0 w-full h-screen overflow-hidden bg-black">
      {/* Full Screen Otter Display with Chart Background */}
      <FullscreenOtterDisplay chatSentiment={chatSentiment} />

      {/* Navigation Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-6 left-6 z-50"
      >
        <Link
          href="/"
          className="group flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-white hover:bg-white/10 transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </Link>
      </motion.div>

      {/* Side Chat Bubbles - Left and Right of GIF with Input at Bottom */}
      <SideChatBubbles onSentimentChange={setChatSentiment} />
    </main>
  )
}

