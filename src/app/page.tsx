import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { LandingFooter } from '@/components/landing/LandingFooter'

export const metadata = {
  title: 'Cinematic Forge — Professional AI Film Production',
  description: 'The world\'s most advanced AI video production platform. Create Hollywood-grade films with AI. By INNOVATIVE.',
}

export default function LandingPage() {
  return (
    <main className="bg-[#0d1117] text-white min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <LandingFooter />
    </main>
  )
}
