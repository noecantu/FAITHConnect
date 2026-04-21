//app/page.tsx

import AnimatedBackground from "./onboarding/components/AnimatedBackground";
import Hero from "./onboarding/components/Hero";
import SpotlightIntro from "./onboarding/components/SpotlightIntro";
import SpotlightOne from "./onboarding/components/SpotlightOne";
import SpotlightTwo from "./onboarding/components/SpotlightTwo";
import Features from "./onboarding/components/Features";
import Pricing from "./onboarding/components/Pricing";
import SpotlightThree from "./onboarding/components/SpotlightThree";
import SpotlightFour from "./onboarding/components/SpotlighFour";
import SpotlightFive from "./onboarding/components/SpotlightFive";

export default function LandingPage() {
  return (
    <div className="relative text-white">

      {/* Background Motion Layer */}
      <AnimatedBackground />

      {/* Foreground Content */}
      <Hero />
      <SpotlightIntro />
      <SpotlightOne />
      <SpotlightTwo />
      <SpotlightThree />
      <SpotlightFour />
      <SpotlightFive />
      <Features />
      <Pricing />
    </div>
  );
}
