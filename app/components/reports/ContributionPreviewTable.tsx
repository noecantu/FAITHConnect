'use client';

import { Member, Contribution } from "@/app/lib/types";

interface Props {
  contributions: Contribution[];
  members: Member[];
  selectedFields: string[];
}

const FIELD_LABELS: Record<string, string> = {
  amount: "Amount",
  date: "Date",
  category: "Category",
  contributionType: "Type",
  notes: "Notes",
};

export function ContributionPreviewTable({
  contributions,
  members,
  selectedFields,
}: Props) {
  // Member is always shown first; never allow it as a dynamic column
  const visibleFields = selectedFields.filter((f) => f !== "memberName");

  return (
    <table className="w-full text-sm">
      <thead className="bg-muted">
        <tr>
          {/* Always show Member first */}
          <th className="p-2 text-left">Member</th>

          {/* Then the selected fields */}
          {visibleFields.map((f) => (
            <th key={f} className="p-2 text-left">
              {FIELD_LABELS[f] ?? f}
            </th>
          ))}
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
              {/* Always show Member first */}
              <td className="p-2">{memberName}</td>

              {/* Then the selected fields */}
              {visibleFields.map((f) => {
                let value: string | number = "";

                switch (f) {
                  case "amount":
                    value = `$${c.amount.toFixed(2)}`;
                    break;

                  case "date":
                    value = new Date(c.date).toLocaleDateString();
                    break;

                  default:
                    value = (c as any)[f] ?? "";
                }

                return (
                  <td key={f} className="p-2">
                    {value}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
