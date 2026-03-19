'use client';

import { Member, Contribution } from "@/app/lib/types";
import { useState } from "react";

interface Props {
  contributions: Contribution[];
  members: Member[];
}

const PAGE_SIZE = 20;

export function ContributionPreviewTable({
  contributions,
  members,
}: Props) {
  const [page, setPage] = useState(0);

  if (!contributions || contributions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contributions found.
      </p>
    );
  }

  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const visibleRows = contributions.slice(start, end);

  const totalPages = Math.ceil(contributions.length / PAGE_SIZE);

  return (
    <div className="space-y-2">
      <table className="w-full text-sm">
        <thead className="bg-muted">
          <tr>
            <th className="p-2 text-left">Member</th>
            <th className="p-2 text-left">Amount</th>
            <th className="p-2 text-left">Date</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Notes</th>
          </tr>
        </thead>

        <tbody>
          {visibleRows.map((c) => {
            const member = members.find((m) => m.id === c.memberId);
            const memberName = member
              ? `${member.firstName} ${member.lastName}`
              : c.memberName ?? "Unknown";

            return (
              <tr key={c.id} className="border-t">
                <td className="p-2">{memberName}</td>
                <td className="p-2">${c.amount.toFixed(2)}</td>
                <td className="p-2">
                  {new Date(c.date).toLocaleDateString()}
                </td>
                <td className="p-2">{c.category ?? ""}</td>
                <td className="p-2">{c.contributionType ?? ""}</td>
                <td className="p-2">{c.notes ?? ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          Showing {start + 1}–{Math.min(end, contributions.length)} of {contributions.length} contributions
        </p>

        <div className="space-x-2">
          <button
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            Previous
          </button>

          <button
            className="px-2 py-1 border rounded text-xs disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
