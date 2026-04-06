//app/onboarding/layout.tsx
import OnboardingGuard from "./OnboardingGuard";
import AnimatedBackground from "./components/AnimatedBackground";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10">
        <OnboardingGuard>
          {children}
        </OnboardingGuard>
      </div>
    </div>
  );
}
