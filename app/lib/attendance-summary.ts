import type { AttendanceHistoryItem } from "../hooks/useAttendanceHistory";

export function summarizeAttendance(history: AttendanceHistoryItem[]) {
  return history.map((item) => {
    const snapshot = item.membersSnapshot || [];
    const records = item.records || {};

    // Active members from the snapshot
    const activeMembers = snapshot.filter((m) => m.status === "Active");
    const activeIds = new Set(activeMembers.map((m) => m.id));

    // Members present
    const membersPresent = activeMembers.filter(
      (m) => records[m.id] === true
    ).length;

    // Members absent
    const membersAbsent = activeMembers.length - membersPresent;

    // Visitors = records not belonging to snapshot members
    const visitorCount = Object.keys(records).filter(
      (id) => !activeIds.has(id)
    ).length;

    // Total members for percentage
    const totalMembers = activeMembers.length;

    const percentage =
      totalMembers === 0 ? 0 : membersPresent / totalMembers;

    return {
      dateString: item.dateString,
      membersPresent,
      membersAbsent,
      visitorCount,
      percentage,
    };
  });
}