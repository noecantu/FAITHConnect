"use client";

import Link from "next/link";
import { useMemberPortal } from "../MemberPortalContext";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";

export default function MemberPortalHome() {
  const { member } = useMemberPortal();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-semibold text-white/90">
          Welcome, {member.firstName}
        </h2>
        <p className="text-white/60 mt-1">
          Access your information below.
        </p>
      </div>

      {/* Calendar Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6 flex flex-col gap-3">
          <h3 className="text-lg font-medium text-white/90">Calendar of Events</h3>
          <p className="text-white/60 text-sm">
            View upcoming church events and activities.
          </p>

          <Link href="/member-portal/calendar" className="w-full">
            <Button className="w-full">View Calendar</Button>
          </Link>
        </CardContent>
      </Card>

      {/* Contributions Card */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardContent className="p-6 flex flex-col gap-3">
          <h3 className="text-lg font-medium text-white/90">Your Contributions</h3>
          <p className="text-white/60 text-sm">
            Review your giving history and totals.
          </p>

          <Link href="/member-portal/contributions" className="w-full">
            <Button className="w-full">View Contributions</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
