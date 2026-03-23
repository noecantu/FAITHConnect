'use client';

import type { Contribution } from '@/app/lib/types';

export function getContributionSummaryText(
  contributions: Contribution[],
  timeFrame: "year" | "month" | "week",
  selectedYear: number | null,
  selectedMonth: number | null,
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

  // YEAR
  if (timeFrame === "year") {
    return `Total Contributions for ${selectedYear}: ${formatted}`;
  }

  // MONTH
  if (timeFrame === "month") {
    if (!selectedMonth) {
      return `Total Contributions for ${selectedYear}: ${formatted}`;
    }

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString(
      "default",
      { month: "long" }
    );

    return `Total Contributions for ${monthName} ${selectedYear}: ${formatted}`;
  }

  // WEEK
  if (timeFrame === "week") {
    if (!selectedWeek) {
      return `Total Contributions for ${selectedYear}: ${formatted}`;
    }

    return `Total Contributions for Week ${selectedWeek}, ${selectedYear}: ${formatted}`;
  }

  return `Total Contributions: ${formatted}`;
}
