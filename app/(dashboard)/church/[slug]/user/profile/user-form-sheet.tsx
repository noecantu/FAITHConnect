"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { ReactNode, useState } from "react";
import type { UserProfile } from "@/app/lib/types";
import { UserForm } from "./user-form";

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
      </SheetContent>
    </Sheet>
  );
}
