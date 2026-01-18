import React from "react"
import { CinematicBackground } from "@/components/cinematic-background"
import { SmoothScroll } from "@/components/smooth-scroll"
import { Mail, MessageSquare, Twitter } from "lucide-react"

export default function ContactPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black text-white/80 font-sans">
        <CinematicBackground>
          <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
            <h1 className="font-serif text-4xl md:text-6xl text-primary mb-8 text-center">Get in Touch</h1>
            <p className="text-xl text-center text-white/60 mb-16 max-w-2xl mx-auto">
              Have questions or want to get involved? The $DEGEN community is always active and ready to help.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center hover:border-primary/50 transition-all group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-all">
                  <Twitter className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif text-white mb-2">Twitter (X)</h3>
                <p className="text-sm text-white/40 mb-4">Follow us for the latest updates and memes.</p>
                <a href="https://x.com/Marcelldegensol" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">@Marcelldegensol</a>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center hover:border-primary/50 transition-all group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-all">
                  <MessageSquare className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif text-white mb-2">Telegram</h3>
                <p className="text-sm text-white/40 mb-4">Join our community chat and meet the degens.</p>
                <a href="https://t.me/marcelldegen" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">Join Chat</a>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center hover:border-primary/50 transition-all group">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-all">
                  <Mail className="text-primary w-8 h-8" />
                </div>
                <h3 className="text-xl font-serif text-white mb-2">Email</h3>
                <p className="text-sm text-white/40 mb-4">For business inquiries and collaborations.</p>
                <a href="mailto:hello@marcelldegen.com" className="text-primary font-bold hover:underline">hello@marcelldegen.com</a>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-10 rounded-3xl">
              <h2 className="text-3xl font-serif text-white mb-8 text-center">Send us a Message</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm uppercase tracking-widest text-white/60">Name</label>
                    <input type="text" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all" placeholder="Your Name" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm uppercase tracking-widest text-white/60">Email</label>
                    <input type="email" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm uppercase tracking-widest text-white/60">Message</label>
                  <textarea className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all h-32" placeholder="How can we help?"></textarea>
                </div>
                <button type="button" className="w-full bg-primary text-black font-bold py-4 rounded-xl hover:bg-primary/90 transition-all uppercase tracking-widest">Send Message</button>
              </form>
            </div>
          </div>
        </CinematicBackground>
      </main>
    </SmoothScroll>
  )
}
