import React from "react"

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        {children}
      </div>
      <footer className="bg-black py-16 px-6 border-t border-white/5 relative z-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="font-serif text-2xl text-primary mb-6">$DEGEN</h3>
              <p className="text-white/40 max-w-md mb-6">
                The most authentic community-driven token on Solana. Built by the community, for the community.
              </p>
              <div className="flex gap-4">
                <a href="https://x.com/Marcelldegensol" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors">Twitter</a>
                <a href="https://tiktok.com/@marcelldegen" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors">TikTok</a>
                <a href="https://t.me/marcelldegen" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-primary transition-colors">Telegram</a>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Project</h4>
              <ul className="space-y-4 text-white/40 text-sm">
                <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-primary transition-colors">Contact</a></li>
                <li><a href="/chat" className="hover:text-primary transition-colors">Chat with Otter</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-6 uppercase tracking-widest text-xs">Legal</h4>
              <ul className="space-y-4 text-white/40 text-sm">
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="/disclaimer" className="hover:text-primary transition-colors">Disclaimer</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-white/20 text-[10px] md:text-xs leading-relaxed max-w-3xl mx-auto mb-8">
              DISCLAIMER: $DEGEN is a meme coin with no intrinsic value or expectation of financial return. $DEGEN is for entertainment purposes only. Investing in cryptocurrencies involves high risk. Never invest more than you can afford to lose.
            </p>
            <p className="text-white/40 text-xs">&copy; {new Date().getFullYear()} $DEGEN. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
