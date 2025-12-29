import { LuxuryHero } from "@/components/luxury-hero"
import { CinematicBackground } from "@/components/cinematic-background"
import { ViralGallery } from "@/components/viral-gallery"
import { LuxurySocials } from "@/components/luxury-socials"
import { CopyAddress } from "@/components/copy-address"
import { SmoothScroll } from "@/components/smooth-scroll"
import { LuxuryPhilosophy } from "@/components/luxury-philosophy"
import { LuxuryHabitat } from "@/components/luxury-habitat"

export default function Home() {
  return (
    <SmoothScroll>
      <main className="min-h-screen bg-black">
        <CinematicBackground>
          <LuxuryHero />
          
          {/* Luxury Transition Gradient */}
          <div className="h-32 w-full bg-gradient-to-b from-transparent to-black/40 -mt-32 relative z-20 pointer-events-none" />
          
          <LuxuryPhilosophy />
          <LuxuryHabitat />
          
          <ViralGallery />
          
          {/* Luxury Transition Gradient */}
          <div className="h-32 w-full bg-gradient-to-b from-transparent to-black/40 -mt-32 relative z-20 pointer-events-none" />
          
          <LuxurySocials />
          
          {/* Minimal Footer */}
          <footer className="py-10 text-center text-white/30 text-sm relative z-10 bg-black">
            <CopyAddress />
            <p className="mb-2 mt-8">Contract: <span className="font-mono text-white/50">Coming Soon</span></p>
            <p>&copy; {new Date().getFullYear()} $DEGEN. All rights reserved.</p>
          </footer>
        </CinematicBackground>
      </main>
    </SmoothScroll>
  )
}
