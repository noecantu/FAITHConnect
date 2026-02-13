import { startOfWeek, endOfWeek, format } from "date-fns";

export function getWeekRange() {
  const now = new Date();

  const start = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(now, { weekStartsOn: 1 });     // Sunday

  return {
    startString: format(start, "yyyy-MM-dd"),
    endString: format(end, "yyyy-MM-dd"),
  };
}
