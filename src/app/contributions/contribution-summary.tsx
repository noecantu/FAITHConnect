'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Contribution } from '@/lib/types';

interface ContributionSummaryProps {
  contributions: Contribution[];
}

export function ContributionSummary({ contributions }: ContributionSummaryProps) {
  const [selectedYear, setSelectedYear] = useState<number | "all">(new Date().getFullYear());

  useEffect(() => {
    const savedYear = localStorage.getItem("fiscalYear");
    if (!savedYear) return;

    if (savedYear === "all") {
      setSelectedYear("all");
    } else {
      setSelectedYear(parseInt(savedYear, 10));
    }
  }, []);

  const totalContributions = useMemo(() => {
    // If "Show All" is selected, sum everything
    if (selectedYear === "all") {
      return contributions.reduce((total, c) => total + Number(c.amount), 0);
    }

    // Otherwise filter by calendar year
    return contributions
      .filter(c => new Date(c.date).getFullYear() === selectedYear)
      .reduce((total, c) => total + Number(c.amount), 0);
  }, [contributions, selectedYear]);

  return (
    <div className="mb-6 text-sm text-muted-foreground">
      <span>
        {selectedYear === "all"
          ? "Total Contributions (All Years): "
          : `Total Contributions for ${selectedYear}: `}
      </span>

      <span className="font-semibold text-foreground">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(totalContributions)}
      </span>
    </div>
  );
}
