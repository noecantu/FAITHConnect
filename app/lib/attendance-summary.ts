import type { AttendanceHistoryItem } from "../hooks/useAttendanceHistory";
import type { Member } from "@/app/lib/types";

export function summarizeAttendance(
  history: AttendanceHistoryItem[],
  members: Member[]
) {
  // Members = Active + Prospect
  const countedMembers = members.filter(
    (m) => m.status === "Active" || m.status === "Prospect"
  );

  const countedIds = new Set(countedMembers.map((m) => m.id));

  return history.map((item) => {
    const records = item.records;

    let presentMembers = 0;
    let absentMembers = 0;
    let presentVisitors = 0;

    // Count Active + Prospect members
    for (const member of countedMembers) {
      const id = member.id;

      if (records[id] === true) {
        presentMembers++;
      } else {
        // Missing OR false → absent
        absentMembers++;
      }
    }

    // Count visitors (records not belonging to counted members)
    for (const id of Object.keys(records)) {
      if (!countedIds.has(id)) {
        presentVisitors++;
      }
    }

    const total = countedMembers.length + presentVisitors;
    const present = presentMembers + presentVisitors;
    const absent = absentMembers; // visitors are NOT counted absent

    return {
      dateString: item.dateString,
      present,
      absent,
      total,
      percentage: total === 0 ? 0 : present / total,
    };
  });
}
