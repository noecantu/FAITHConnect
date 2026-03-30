"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberPortalContext, MemberPortalContextType } from "./MemberPortalContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase/client";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

type MemberPortalLayoutProps = {
  children: React.ReactNode;
};

export default function MemberPortalLayout({ children }: MemberPortalLayoutProps) {
  const router = useRouter();

  const [member, setMember] = useState<MemberPortalContextType["member"] | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawMemberId = sessionStorage.getItem("memberId");
    const rawChurchId = sessionStorage.getItem("churchId");

    if (!rawMemberId || !rawChurchId) {
      router.push("/member-portal");
      return;
    }

    const memberId = rawMemberId as string;
    const churchId = rawChurchId as string;

    setChurchId(churchId);

    async function loadMember() {
      try {
        const ref = doc(db, "churches", churchId, "members", memberId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          sessionStorage.removeItem("memberId");
          sessionStorage.removeItem("churchId");
          router.push("/member-portal");
          return;
        }

        setMember({
          id: memberId,
          ...(snap.data() as any),
        } as MemberPortalContextType["member"]);

      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [router]);

  if (loading) {
    return <div className="p-6 text-white/70">Loading your portal…</div>;
  }

  if (!member || !churchId) return null;

  function logout() {
    sessionStorage.removeItem("memberId");
    sessionStorage.removeItem("churchId");
    router.push("/member-portal");
  }

  return (
    <MemberPortalContext.Provider value={{ member, churchId }}>
      <div className="min-h-screen p-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-white/90">Member Portal</h1>

          <div className="flex items-center gap-3">
            <span className="text-white/60 text-sm">
              {member.firstName} {member.lastName}
            </span>

            <Button
              variant="outline"
              onClick={logout}
              className="border-white/20 text-white/70"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex gap-6 mb-6 text-white/70 text-sm">
          <Link href="/member-portal/home" className="hover:text-white/90">
            Home
          </Link>
          <Link href="/member-portal/calendar" className="hover:text-white/90">
            Calendar
          </Link>
          <Link href="/member-portal/contributions" className="hover:text-white/90">
            Contributions
          </Link>
        </nav>

        {/* Page Content */}
        <div className="animate-fadeIn">{children}</div>

        {/* Footer */}
        <footer className="mt-12 text-center text-white/40 text-xs">
          FAITH Conexion Member Portal
        </footer>
      </div>
    </MemberPortalContext.Provider>
  );
}
