import { useState, useMemo } from "react";

export type AttendanceFilter = "all" | "future" | "past";
export type AttendanceSort = "newest" | "oldest";

export interface AttendanceSummary {
  dateString: string;
  present: number;
  absent: number;
  percentage: number;
}

export function useAttendanceFilters(data: AttendanceSummary[]) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<AttendanceFilter>("all");
  const [sort, setSort] = useState<AttendanceSort>("newest");

  const filtered = useMemo(() => {
    const now = new Date();
    let result = [...data];

    // SEARCH
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((i) =>
        i.dateString.toLowerCase().includes(q)
      );
    }

    // FILTER
    if (filter === "future") {
      result = result.filter((i) => new Date(i.dateString) > now);
    } else if (filter === "past") {
      result = result.filter((i) => new Date(i.dateString) < now);
    }

    // SORT
    result.sort((a, b) => {
      const da = new Date(a.dateString).getTime();
      const db = new Date(b.dateString).getTime();
      return sort === "oldest" ? da - db : db - da;
    });

    return result;
  }, [data, search, filter, sort]);

  return {
    search,
    setSearch,
    filter,
    setFilter,
    sort,
    setSort,
    filtered,
  };
}
