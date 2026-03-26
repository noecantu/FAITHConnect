"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { ReactNode, useState } from "react";
import type { UserProfile } from "@/app/lib/types";
import { UserForm } from "./user-form";
import { CalendarPreferencesCard } from "@/app/settings/access-management/components/CalendarPreferencesCard";

export function UserFormSheet({
  user,
  children,
}: {
  user: UserProfile;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>

      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
        </SheetHeader>

        <UserForm user={user} onClose={() => setOpen(false)} />

        {/* Add this */}
        <div className="mt-6">
          <CalendarPreferencesCard userId={user.id} />
        </div>
      </SheetContent>

    </Sheet>
  );
}
