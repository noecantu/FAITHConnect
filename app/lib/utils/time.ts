// Validate "HH:mm" format (24-hour)
export function isValidTimeString(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;

  const [h, m] = time.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

// Normalize sloppy input like "9:5" → "09:05"
export function normalizeTimeString(time: string): string {
  const parts = time.split(":");
  if (parts.length !== 2) return time;

  const [h, m] = parts;
  const hour = h.padStart(2, "0");
  const minute = m.padStart(2, "0");

  return `${hour}:${minute}`;
}

// Format "14:00" → "2:00 PM" for UI
export function formatTimeForUI(time: string): string {
  if (!isValidTimeString(time)) return time;

  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 || 12;
  const ampm = h < 12 ? "AM" : "PM";

  return `${hour12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
