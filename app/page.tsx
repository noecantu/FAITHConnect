//app/page.tsx

import AnimatedBackground from "./onboarding/components/AnimatedBackground";
import Hero from "./onboarding/components/Hero";
import SpotlightOne from "./onboarding/components/SpotlightOne";
import SpotlightTwo from "./onboarding/components/SpotlightTwo";
import Features from "./onboarding/components/Features";
import Pricing from "./onboarding/components/Pricing";

export default function LandingPage() {
  return (
    <div className="relative text-white">

      {/* Background Motion Layer */}
      <AnimatedBackground />

      {/* Foreground Content */}
      <Hero />
      <SpotlightOne />
      <SpotlightTwo />
      <Features />
      <Pricing />
    </div>
  );
}
