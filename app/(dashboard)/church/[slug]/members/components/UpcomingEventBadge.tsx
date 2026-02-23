'use client';

import { Badge } from "@/app/components/ui/badge";
import { format, isValid } from "date-fns";

type Props = {
  dateString?: string | null;
  label: string;
};

export default function UpcomingEventBadge({ dateString, label }: Props) {
  if (!dateString) return null;

  const date = new Date(dateString);
  if (!isValid(date)) return null;

  const formatted = format(date, "MMM d");

  return (
    <Badge variant="secondary" className="text-xs">
      {label}: {formatted}
    </Badge>
  );
}
