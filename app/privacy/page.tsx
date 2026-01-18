import React from "react"
import { CinematicBackground } from "@/components/cinematic-background"
import { SmoothScroll } from "@/components/smooth-scroll"

export default function PrivacyPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black text-white/80 font-sans">
        <CinematicBackground>
          <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
            <h1 className="font-serif text-4xl md:text-6xl text-primary mb-12">Privacy Policy</h1>
            
            <div className="space-y-8 text-lg leading-relaxed">
              <section>
                <h2 className="text-2xl font-serif text-white mb-4">1. Introduction</h2>
                <p>
                  Welcome to $DEGEN. We respect your privacy and are committed to protecting any information that may be collected through your use of our website. This Privacy Policy explains how we handle information.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">2. Information Collection</h2>
                <p>
                  $DEGEN is a community-driven project. We do not require you to create an account or provide personal information to browse our site. We may collect non-personal information such as browser type, language preference, and the date and time of each visitor request to better understand how visitors use the site.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">3. Cookies</h2>
                <p>
                  We may use cookies to enhance your experience. You can set your browser to refuse cookies, but some parts of the site may not function properly without them.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">4. Third-Party Links</h2>
                <p>
                  Our site contains links to third-party websites (e.g., Dexscreener, X, TikTok). We are not responsible for the privacy practices or content of these external sites.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">5. Security</h2>
                <p>
                  We implement standard security measures to protect our website, but please be aware that no method of transmission over the internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">6. Changes to This Policy</h2>
                <p>
                  We may update our Privacy Policy from time to time. We encourage visitors to frequently check this page for any changes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">7. Contact Us</h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact the community via our official social media channels.
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
