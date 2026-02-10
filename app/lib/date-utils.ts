import { format } from "date-fns";

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function fromDateString(dateString: string): Date {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // noon avoids timezone drift
}

export function toDateTime(dateString: string, timeString: string): Date {
  const [y, m, d] = dateString.split("-").map(Number);
  const [h, min] = timeString.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0);
}
