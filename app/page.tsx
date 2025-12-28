import { OtterHero } from "@/components/otter-hero"
import { JungleSocials } from "@/components/jungle-socials"
import { TikTokSection } from "@/components/tiktok-section"
import { Footer } from "@/components/footer"
import { Navigation } from "@/components/navigation"

export default function Page() {
  return (
    <main className="relative min-h-screen bg-[#051F20]">
      <Navigation />
      <OtterHero />
      <TikTokSection />
      <JungleSocials />
      <Footer />
    </main>
  )
}
