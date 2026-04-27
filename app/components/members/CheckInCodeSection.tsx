"use client";

import { useState } from "react";
import {
  Card,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";
import { generateCheckInCode } from "@/app/lib/utils/generateCheckInCode";
import { Copy, RefreshCw, ShieldCheck } from "lucide-react";

export function CheckInCodeSection({
  member,
  churchId,
}: {
  member: any;
  churchId: string;
}) {
  const [code, setCode] = useState(member.checkInCode ?? "");
  const [isRegenerating, setIsRegenerating] = useState(false);

  async function regenerate() {
    setIsRegenerating(true);

    try {
      const newCode = generateCheckInCode();

      const { error } = await getSupabaseClient()
        .from("members")
        .update({ check_in_code: newCode })
        .eq("id", member.id)
        .eq("church_id", churchId);

      if (error) {
        throw error;
      }

      setCode(newCode);
      toast({
        title: "Check-In code updated",
        description: "A new code has been generated successfully.",
      });
    } catch (err) {
      console.error("Failed to regenerate check-in code:", err);
      toast({
        title: "Could not regenerate code",
        description: "Please try again.",
      });
    } finally {
      setIsRegenerating(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code copied",
        description: "The check-in code is ready to paste.",
      });
    } catch (err) {
      console.error("Failed to copy check-in code:", err);
      toast({
        title: "Copy failed",
        description: "Please copy the code manually.",
      });
    }
  }

  return (
    <Card className="relative overflow-hidden border-cyan-300/30 bg-gradient-to-br from-cyan-500/10 via-black/80 to-black/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.22),transparent_55%)]" />

      <CardContent className="relative grid gap-5 p-6 md:grid-cols-[1fr_auto] md:items-stretch">
        <div className="space-y-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
            <ShieldCheck className="h-3 w-3" />
            Secure Attendance
          </div>

          <CardTitle className="text-xl">Check-In Code</CardTitle>

          <p className="text-sm text-muted-foreground">
            Use this code for member self check-in. Regenerating will immediately invalidate the previous code.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="outline" onClick={copy} className="gap-2 border-cyan-200/35 bg-white/5 hover:bg-cyan-400/10">
              <Copy className="h-4 w-4" />
              Copy code
            </Button>

            <Button type="button" variant="secondary" onClick={regenerate} disabled={isRegenerating} className="gap-2">
              <RefreshCw className={isRegenerating ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {isRegenerating ? "Regenerating..." : "Regenerate code"}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-cyan-300/35 bg-black/40 p-3 md:ml-3 md:h-36 md:w-36 md:self-center flex items-center justify-center">
          <div className="font-mono text-lg font-semibold tracking-[0.22em] text-cyan-100 text-center break-all">
            {code || "NO CODE"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
