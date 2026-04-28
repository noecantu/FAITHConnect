//app/page.tsx

import { redirect } from "next/navigation";
import { getDashboardRoute } from "@/app/lib/auth/dashboardRoute";
import { getCurrentUser } from "@/app/lib/auth/server/getCurrentUser";
import AnimatedBackground from "./onboarding/components/AnimatedBackground";
import Hero from "./onboarding/components/Hero";
import SpotlightIntro from "./onboarding/components/SpotlightIntro";
import SpotlightOne from "./onboarding/components/SpotlightOne";
import SpotlightTwo from "./onboarding/components/SpotlightTwo";
import Features from "./onboarding/components/Features";
import Pricing from "./onboarding/components/Pricing";
import FreeTrial from "./onboarding/components/FreeTrial";
import SpotlightThree from "./onboarding/components/SpotlightThree";
import SpotlightFour from "./onboarding/components/SpotlighFour";
import SpotlightFive from "./onboarding/components/SpotlightFive";

export default async function LandingPage() {
  const user = await getCurrentUser();

  if (user) {
    redirect(
      getDashboardRoute({
        roles: user.roles,
        churchId: user.churchId,
        districtId: user.districtId,
        regionId: user.regionId,
        onboardingComplete: user.onboardingComplete,
        onboardingStep: user.onboardingStep,
        isRootAdmin: user.roles?.includes("RootAdmin") ?? false,
        isSystemUser: user.roles?.includes("SystemAdmin") ?? false,
      })
    );
  }

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
      <FreeTrial />
    </div>
  );
}
