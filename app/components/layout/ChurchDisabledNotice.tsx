"use client";

import { AlertTriangle, Lock } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";

export function ChurchDisabledNotice({ churchName }: { churchName?: string }) {
  return (
    <Card className="border-rose-500/35 bg-rose-500/5 backdrop-blur-sm">
      <CardContent className="p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-rose-400/35 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-rose-200/80">Church Status</p>
              <h2 className="mt-1 text-xl font-semibold text-rose-100">Church Access Restricted</h2>
            </div>

            <p className="text-sm text-rose-100/90">
              {churchName ? `${churchName} is currently disabled by system administration.` : "This church is currently disabled by system administration."}
              {" "}
              Access is limited to this dashboard until the church is re-enabled.
            </p>

            <div className="rounded-lg border border-rose-400/20 bg-black/25 p-3 text-sm">
              <p className="mb-2 inline-flex items-center gap-2 font-medium text-rose-200">
                <Lock className="h-4 w-4" />
                What this means right now
              </p>
              <ul className="list-disc space-y-1 pl-5 text-rose-100/80">
                <li>Members and staff cannot use church feature pages.</li>
                <li>Navigation is intentionally limited to the dashboard.</li>
                <li>A Root Admin can restore full access by enabling the church.</li>
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
