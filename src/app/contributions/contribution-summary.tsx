'use client';

import type { Contribution } from '@/lib/types';

export function getContributionSummaryText(
  contributions: Contribution[],
  fiscalYear: string
) {
  const total =
    fiscalYear === "all"
      ? contributions.reduce((t, c) => t + Number(c.amount), 0)
      : contributions
          .filter(c => new Date(c.date).getFullYear() === Number(fiscalYear))
          .reduce((t, c) => t + Number(c.amount), 0);

  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(total);

  return fiscalYear === "all"
    ? `Total Contributions (All Years): ${formatted}`
    : `Total Contributions for ${fiscalYear}: ${formatted}`;
}
