'use client';

import { Member, Contribution } from "@/app/lib/types";

interface Props {
  contributions: Contribution[];
  members: Member[];
}

const MAX_PREVIEW_ROWS = 20;

export function ContributionPreviewTable({
  contributions,
  members,
}: Props) {
  if (!contributions || contributions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contributions found.
      </p>
    );
  }

  // Limit preview rows
  const visibleRows = contributions.slice(0, MAX_PREVIEW_ROWS);

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

      {contributions.length > MAX_PREVIEW_ROWS && (
        <p className="text-xs text-muted-foreground">
          Showing first {MAX_PREVIEW_ROWS} of {contributions.length} contributions
        </p>
      )}
    </div>
  );
}
