'use client';

import type { Contribution } from '@/app/lib/types';

export function getContributionSummaryText(
  contributions: Contribution[],
  timeFrame: "year" | "month" | "week",
  selectedYear: string | null,
  selectedMonth: string | null,
  selectedWeek: number | null
) {
  const total = contributions.reduce((t, c) => t + Number(c.amount), 0);

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(total);

  // No filters selected yet
  if (!selectedYear) {
    return `Total Contributions: ${formatted}`;
  }

  // YEAR SUMMARY
  if (timeFrame === "year") {
    return `Total Contributions for ${selectedYear}: ${formatted}`;
  }

  // MONTH SUMMARY
  if (timeFrame === "month") {
    if (!selectedMonth) {
      return `Total Contributions for ${selectedYear}: ${formatted}`;
    }

    const monthName = new Date(
      Number(selectedYear),
      Number(selectedMonth) - 1
    ).toLocaleString("default", { month: "long" });

    return `Total Contributions for ${monthName} ${selectedYear}: ${formatted}`;
  }

  // WEEK SUMMARY
  if (timeFrame === "week") {
    if (!selectedWeek) {
      return `Total Contributions for ${selectedYear}: ${formatted}`;
    }

    return `Total Contributions for Week ${selectedWeek}, ${selectedYear}: ${formatted}`;
  }

  return `Total Contributions: ${formatted}`;
}
