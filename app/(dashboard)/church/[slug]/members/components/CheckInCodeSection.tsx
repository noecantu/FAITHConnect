"use client";

import { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { toast } from "@/app/hooks/use-toast";

export function CheckInCodeSection({
  member,
  churchId,
}: {
  member: any;
  churchId: string;
}) {
  const [code, setCode] = useState(member.checkInCode ?? "");

  async function regenerate() {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    await updateDoc(
      doc(db, "churches", churchId, "members", member.id),
      { checkInCode: newCode }
    );

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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Check‑In Code</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This code is used for Self Check‑In for Attendance purposes.
        </p>

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
