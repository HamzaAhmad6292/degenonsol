import React from "react"
import { CinematicBackground } from "@/components/cinematic-background"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Sparkles, Users, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black text-white/80 font-sans">
        <CinematicBackground>
          <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
            <h1 className="font-serif text-4xl md:text-6xl text-primary mb-8">About $DEGEN</h1>
            <p className="text-2xl font-light text-white/60 mb-16 italic">
              "The most authentic TikTok crypto token, built by the community, for the community."
            </p>
            
            <div className="space-y-16 text-lg leading-relaxed">
              <section className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl font-serif text-white mb-6 flex items-center gap-3">
                    <Sparkles className="text-primary w-8 h-8" />
                    Our Origin
                  </h2>
                  <p>
                    $DEGEN was born from the viral success of the TikTok otter, Marcell. What started as a series of playful videos captured the hearts of millions worldwide. We decided to bring that same joy and authenticity to the Solana blockchain.
                  </p>
                </div>
                <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                  <img 
                    src="/mascot.png" 
                    alt="$DEGEN Mascot" 
                    className="w-full h-auto rounded-2xl shadow-2xl"
                  />
                </div>
              </section>

              <section>
                <h2 className="text-3xl font-serif text-white mb-6 flex items-center gap-3">
                  <Users className="text-primary w-8 h-8" />
                  Community First
                </h2>
                <p>
                  Unlike many projects, $DEGEN has no venture capital backing, no private sales, and no hidden agendas. It is 100% organic. The project's direction is shaped by the community members who share a love for the otter lifestyle and the degen spirit.
                </p>
              </section>

              <section className="bg-primary/5 border border-primary/20 p-10 rounded-3xl">
                <h2 className="text-3xl font-serif text-primary mb-6 flex items-center gap-3">
                  <Heart className="text-primary w-8 h-8" />
                  Our Mission
                </h2>
                <p className="text-xl text-white/90">
                  Our mission is simple: to create a digital sanctuary for degens where luxury aesthetics meet community fun. We aim to be the most transparent and authentic meme token on Solana, proving that a project can thrive on pure community energy.
                </p>
              </section>

              <section>
                <h2 className="text-3xl font-serif text-white mb-6">The Otter Lifestyle</h2>
                <p>
                  Being a part of $DEGEN means embracing the otter lifestyle—playful, social, and always ready for the next adventure. We're building more than just a token; we're building a culture.
                </p>
              </section>
            </div>
            
            <div className="mt-20 pt-10 border-t border-white/10 text-center">
              <p className="text-white/40 mb-4">Join the movement today.</p>
              <div className="flex justify-center gap-6">
                <a href="https://x.com/Marcelldegensol" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">Twitter (X)</a>
                <a href="https://tiktok.com/@marcelldegen" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">TikTok</a>
                <a href="https://t.me/marcelldegen" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors">Telegram</a>
              </div>
            </div>
          </div>
        </CinematicBackground>
      </main>
    </SmoothScroll>
  )
}
