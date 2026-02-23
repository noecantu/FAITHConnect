'use client';

import { Badge, type BadgeProps } from "@/app/components/ui/badge";

type Status = "Active" | "Prospect" | "Archived";

// BadgeProps["variant"] gives us the EXACT allowed variant type
type BadgeVariant = BadgeProps["variant"];

export default function StatusBadge({ status }: { status: Status }) {
  if (!status) return null;

  const variant: BadgeVariant =
    status === "Active"
      ? "secondary"
      : status === "Prospect"
      ? "default"
      : "outline";

  const className =
    status === "Prospect"
      ? "bg-red-500/50 text-white"
      : status === "Archived"
      ? "bg-muted text-muted-foreground"
      : "";

  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  );
}
