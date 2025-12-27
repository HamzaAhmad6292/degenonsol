import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { TokenomicsSection } from "@/components/tokenomics-section"
import { CommunitySection } from "@/components/community-section"
import { InteractiveSection } from "@/components/interactive-section"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"

export default function Page() {
  return (
    <main className="relative min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <TokenomicsSection />
      <CommunitySection />
      <InteractiveSection />
      <Footer />
    </main>
  )
}
