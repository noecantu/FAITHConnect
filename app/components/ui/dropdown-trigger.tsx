'use client';

import { ChevronDown } from "lucide-react";

export function DropdownTrigger({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between h-10 px-3 py-2 text-sm">
      <span className="truncate">{children}</span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </div>
  );
}
