"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { getSupabaseClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";
import { generateCheckInCode } from "@/app/lib/utils/generateCheckInCode";

export function CheckInCodeSection({
  member,
  churchId,
}: {
  member: any;
  churchId: string;
}) {
  const [code, setCode] = useState(member.checkInCode ?? "");

  async function regenerate() {
    const newCode = generateCheckInCode();

    await getSupabaseClient()
      .from("members")
      .update({ check_in_code: newCode })
      .eq("id", member.id)
      .eq("church_id", churchId);

    setCode(newCode);

    toast({
      title: "Check‑In Code Updated",
      description: "A new check‑in code has been generated.",
    });
  }

  function copy() {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "The check‑in code has been copied.",
    });
  }

  return (
    <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-xl">Check‑In Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        <div className="flex items-center gap-4">
          <span className="font-mono text-base px-2 py-1 rounded border bg-muted">
            {code}
          </span>

          <Button type="button" variant="outline" onClick={copy}>
            Copy
          </Button>

          <Button type="button" variant="secondary" onClick={regenerate}>
            Regenerate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
