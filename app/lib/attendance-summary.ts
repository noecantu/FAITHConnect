import { AttendanceHistoryItem } from "../hooks/useAttendanceHistory";

export function summarizeAttendance(history: AttendanceHistoryItem[]) {
  return history.map((item) => {
    const values = Object.values(item.records);
    const present = values.filter((v) => v).length;
    const absent = values.length - present;

    return {
      dateString: item.dateString,
      present,
      absent,
      total: values.length,
      percentage: values.length === 0 ? 0 : present / values.length,
    };
  });
}
