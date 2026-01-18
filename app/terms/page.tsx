import React from "react"
import { CinematicBackground } from "@/components/cinematic-background"
import { SmoothScroll } from "@/components/smooth-scroll"

export default function TermsPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black text-white/80 font-sans">
        <CinematicBackground>
          <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
            <h1 className="font-serif text-4xl md:text-6xl text-primary mb-12">Terms of Service</h1>
            
            <div className="space-y-8 text-lg leading-relaxed">
              <section>
                <h2 className="text-2xl font-serif text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. $DEGEN is a community-driven meme token project.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">2. Nature of the Project</h2>
                <p>
                  $DEGEN is a cryptocurrency token created for entertainment and community purposes. It is not an investment product, security, or financial instrument. The project is managed by the community and has no formal company structure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">3. No Financial Advice</h2>
                <p>
                  The content on this website is for informational and entertainment purposes only and does not constitute financial, investment, or legal advice. You should conduct your own research and consult with a professional before making any financial decisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">4. Risk Disclosure</h2>
                <p>
                  Trading cryptocurrencies involves significant risk and can result in the loss of your capital. You should only trade with money you can afford to lose. $DEGEN is highly volatile and its value can go to zero.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">5. Limitation of Liability</h2>
                <p>
                  The community and developers of $DEGEN shall not be liable for any losses or damages arising from your use of the website or the $DEGEN token.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">6. Intellectual Property</h2>
                <p>
                  The logos, branding, and content on this site are the property of the $DEGEN community. You may use them for non-commercial, community-related purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">7. Governing Law</h2>
                <p>
                  As a decentralized community project, $DEGEN operates globally. Any disputes will be handled within the community through decentralized governance mechanisms where applicable.
                </p>
              </section>
            </div>
            
            <div className="mt-20 pt-10 border-t border-white/10 text-sm text-white/40">
              Last Updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </CinematicBackground>
      </main>
    </SmoothScroll>
  )
}
