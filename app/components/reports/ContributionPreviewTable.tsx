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
        </tr>
      </thead>

      <tbody>
        {contributions.map((c) => {
          const member = members.find((m) => m.id === c.memberId);

          return (
            <tr key={c.id} className="border-t">
              <td className="p-2">
                {member
                  ? `${member.firstName} ${member.lastName}`
                  : "Unknown"}
              </td>

              <td className="p-2">${c.amount.toFixed(2)}</td>

              <td className="p-2">
                {new Date(c.date).toLocaleDateString()}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
