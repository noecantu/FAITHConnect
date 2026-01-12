'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Contribution } from '@/lib/types';

interface ContributionSummaryProps {
  contributions: Contribution[];
}

export function ContributionSummary({ contributions }: ContributionSummaryProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const savedYear = localStorage.getItem("fiscalYear");
    if (savedYear) {
      setSelectedYear(parseInt(savedYear, 10));
    }
  }, []);

  const totalContributions = useMemo(() => {
    return contributions
      .filter(c => new Date(c.date).getFullYear() === selectedYear)
      .reduce((total, c) => total + Number(c.amount), 0); // Explicitly cast to Number
  }, [contributions, selectedYear]);

  return (
    <div className="mb-6 text-sm text-muted-foreground">
      <span>Total Contributions for {selectedYear}: </span>
      <span className="font-semibold text-foreground">
        {new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(totalContributions)}
      </span>
    </div>
  );
}
