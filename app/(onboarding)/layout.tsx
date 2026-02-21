import React from "react";
import { cn } from "@/app/lib/utils";

interface OnboardingLayoutProps {
  children: React.ReactNode;
}

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div
      className={cn(
        "w-full",
        "flex flex-col items-center",
        "px-4"
      )}
    >
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}
