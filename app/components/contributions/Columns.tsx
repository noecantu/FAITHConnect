'use client';

import type { ColumnDef } from '@tanstack/react-table';
import type { Contribution } from '@/app/lib/types';

export const getColumns = (): ColumnDef<Contribution>[] => [
  {
    accessorKey: 'memberName',
    header: 'Member Name',
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('amount'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);
      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'));
      return date.toLocaleDateString();
    },
  },
  {
    accessorKey: 'category',
    header: 'Category',
  },
  {
    accessorKey: 'contributionType',
    header: 'Type',
  },
];
