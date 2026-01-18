import React from "react"
import { CinematicBackground } from "@/components/cinematic-background"
import { SmoothScroll } from "@/components/smooth-scroll"

export default function DisclaimerPage() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black text-white/80 font-sans">
        <CinematicBackground>
          <div className="container mx-auto px-6 py-32 max-w-4xl relative z-10">
            <h1 className="font-serif text-4xl md:text-6xl text-primary mb-12">Disclaimer</h1>
            
            <div className="space-y-8 text-lg leading-relaxed">
              <section className="bg-primary/5 border border-primary/20 p-8 rounded-2xl">
                <h2 className="text-2xl font-serif text-primary mb-4">IMPORTANT NOTICE</h2>
                <p className="font-bold text-white">
                  $DEGEN is a meme coin with no intrinsic value or expectation of financial return. There is no formal team or roadmap. The coin is completely useless and for entertainment purposes only.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">1. Not Financial Advice</h2>
                <p>
                  The information provided on this website does not constitute investment advice, financial advice, trading advice, or any other sort of advice and you should not treat any of the website's content as such. $DEGEN does not recommend that any cryptocurrency should be bought, sold, or held by you.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">2. Accuracy of Information</h2>
                <p>
                  $DEGEN will strive to ensure accuracy of information listed on this website although it will not hold any responsibility for any missing or wrong information. You understand that you are using any and all information available here at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">3. Risk of Investing</h2>
                <p>
                  The price of $DEGEN and other cryptocurrencies are highly volatile. It is possible for prices to fluctuate significantly in a short period of time. You should be aware of the risks involved in trading cryptocurrencies and should only invest what you can afford to lose.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">4. No Guarantees</h2>
                <p>
                  There are no guarantees of profit or success. The project is community-driven and its future depends entirely on community participation and market sentiment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-serif text-white mb-4">5. Compliance with Local Laws</h2>
                <p>
                  It is your responsibility to ensure that you are compliant with your local laws and regulations regarding the purchase and holding of cryptocurrencies.
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
