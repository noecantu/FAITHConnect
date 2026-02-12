'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Pencil, Trash2 } from "lucide-react";
import { Button } from '../components/ui/button';
import type { Contribution } from '../lib/types';

export const getColumns = (
  onEdit: (contribution: Contribution) => void,
  onDelete: (contribution: Contribution) => void
): ColumnDef<Contribution>[] => [
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
  {
    id: "actions",
    header: "Action",
    cell: ({ row }) => {
      const contribution = row.original;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(contribution)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(contribution)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      );
    },
  }
];
