"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { toast } from "@/app/hooks/use-toast";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";

export default function MemberPortalLogin() {
  const [code, setCode] = useState("");
  const router = useRouter();

  async function handleLogin() {
    const clean = code.trim().toUpperCase();

    if (clean.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6‑character code.",
      });
      return;
    }

    const churchesSnap = await getDocs(collection(db, "churches"));

    for (const church of churchesSnap.docs) {
      const membersRef = collection(db, "churches", church.id, "members");
      const q = query(membersRef, where("checkInCode", "==", clean));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const member = snap.docs[0];

        sessionStorage.setItem("memberId", member.id);
        sessionStorage.setItem("churchId", church.id);

        toast({
          title: "Welcome",
          description: "Loading your portal…",
        });

        router.push("/member-portal/home");
        return;
      }
    }

    toast({
      title: "Not Found",
      description: "No member found with that code.",
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <Image
              src="/F-Flame_Vector_Optimized.svg"
              alt="FAITH Conexion Logo"
              width={48}
              height={48}
            />
          </div>

          <CardTitle className="text-2xl font-semibold">
            FAITH Conexion
          </CardTitle>

          <CardDescription>
            Access your member portal
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">6‑Character Code</label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="text-center tracking-widest font-mono text-lg"
            />
          </div>

          <Button className="w-full" onClick={handleLogin}>
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
