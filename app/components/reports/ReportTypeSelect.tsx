'use client';

import { BarChart3, CalendarHeart, HandCoins, ListMusic, UsersRound } from "lucide-react";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { cn } from "@/app/lib/utils";

interface Props {
  value: "none" | "members" | "contributions" | "attendance" | "setlists" | "serviceplans";
  onChange: (v: "none" | "members" | "contributions" | "attendance" | "setlists" | "serviceplans") => void;
  canReadMembers: boolean;
  canReadContributions: boolean;
  canReadAttendance: boolean;
  canReadSetLists: boolean;
  canReadServicePlans: boolean;
}

export function ReportTypeSelect({
  value,
  onChange,
  canReadMembers,
  canReadContributions,
  canReadAttendance,
  canReadSetLists,
  canReadServicePlans,
}: Props) {
  const options = [
    {
      key: "attendance" as const,
      label: "Attendance",
      detail: "Trends by month and year",
      icon: BarChart3,
      enabled: canReadAttendance,
    },
    {
      key: "contributions" as const,
      label: "Contributions",
      detail: "Giving totals and breakdowns",
      icon: HandCoins,
      enabled: canReadContributions,
    },
    {
      key: "members" as const,
      label: "Members",
      detail: "Directory and profile data",
      icon: UsersRound,
      enabled: canReadMembers,
    },
    {
      key: "serviceplans" as const,
      label: "Service Plans",
      detail: "Selected service plan details",
      icon: CalendarHeart,
      enabled: canReadServicePlans,
    },
    {
      key: "setlists" as const,
      label: "Set Lists",
      detail: "Selected service set list details",
      icon: ListMusic,
      enabled: canReadSetLists,
    },
  ].filter((option) => option.enabled);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Report Type</Label>

      <div className="grid grid-cols-1 gap-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = value === option.key;

          return (
            <Button
              key={option.key}
              type="button"
              variant="outline"
              className={cn(
                "h-auto w-full min-w-0 items-start justify-start gap-3 px-3 py-3 text-left whitespace-normal",
                "border-white/20 bg-black/60 hover:bg-black/80",
                active && "border-white/60 bg-white/10"
              )}
              onClick={() => onChange(option.key)}
            >
              <Icon className={cn("mt-0.5 h-4 w-4", active ? "text-white" : "text-white/70")} />
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium leading-tight text-white break-words">{option.label}</span>
                <span className="text-xs leading-snug text-white/70 whitespace-normal break-words">{option.detail}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
