'use client';

import { Member, Contribution } from "@/app/lib/types";

interface Props {
  contributions: Contribution[];
  members: Member[];
}

export function ContributionPreviewTable({
  contributions,
  members,
}: Props) {
  return (
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
        {contributions.map((c) => {
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
  );
}
