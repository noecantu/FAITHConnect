//app/page.tsx

import AnimatedBackground from "./onboarding/components/AnimatedBackground";
import Hero from "./onboarding/components/Hero";
import SpotlightOne from "./onboarding/components/SpotlightOne";
import SpotlightTwo from "./onboarding/components/SpotlightTwo";
import Features from "./onboarding/components/Features";
import Pricing from "./onboarding/components/Pricing";
import SpotlightThree from "./onboarding/components/SpotlightThree";
import SpotlightFour from "./onboarding/components/SpotlighFour";

export default function LandingPage() {
  return (
    <div className="relative text-white">

      {/* Background Motion Layer */}
      <AnimatedBackground />

      {/* Foreground Content */}
      <Hero />
      <SpotlightOne />
      <SpotlightTwo />
      <SpotlightThree />
      <SpotlightFour />
      <Features />
      <Pricing />
    </div>
  );
}
