import type { AttendanceHistoryItem } from "../hooks/useAttendanceHistory";

export function summarizeAttendance(history: AttendanceHistoryItem[]) {
  return history.map((item) => {
    const snapshot = item.membersSnapshot || [];
    const records = item.records || {};

    // Only count Active members from the snapshot
    const activeMembers = snapshot.filter(
      (m) => m.status === "Active"
    );

    const present = activeMembers.filter(
      (m) => records[m.id] === true
    ).length;

    const absent = activeMembers.length - present;

    const total = activeMembers.length;

    return {
      dateString: item.dateString,
      present,
      absent,
      total,
      percentage: total === 0 ? 0 : present / total,
    };
  });
}
