// Convert a JS Date → "YYYY-MM-DD" (local time, no timezone shift)
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Convert "YYYY-MM-DD" → JS Date (local time)
export function fromDateString(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

// Combine dateString + timeString → JS Date (local time)
export function toDateTime(dateString: string, timeString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute);
}
