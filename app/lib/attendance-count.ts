type AttendanceCountData = {
  records?: unknown;
  visitors?: unknown;
};

export function countPresentAttendanceEntries(data: AttendanceCountData): number {
  const records =
    data.records && typeof data.records === "object" && !Array.isArray(data.records)
      ? (data.records as Record<string, unknown>)
      : {};

  const membersPresent = Object.values(records).filter((value) => value === true).length;

  let visitorCount = 0;

  if (Array.isArray(data.visitors)) {
    visitorCount = data.visitors.length;
  } else if (typeof data.visitors === "number") {
    visitorCount = data.visitors;
  } else if (data.visitors && typeof data.visitors === "object") {
    visitorCount = Object.keys(data.visitors as Record<string, unknown>).length;
  }

  return membersPresent + visitorCount;
}