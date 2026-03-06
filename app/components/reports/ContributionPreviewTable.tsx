'use client';

import { Member, Contribution } from "@/app/lib/types";

interface Props {
  contributions: Contribution[];
  members: Member[];
  selectedFields: string[];
}

const contributionFieldLabelMap: Record<string, string> = {
  memberName: "Member",
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
  return (
    <table className="w-full text-sm">
      <thead className="bg-muted">
        <tr>
          {selectedFields.map((f) => (
            <th key={f} className="p-2 text-left">
              {contributionFieldLabelMap[f]}
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
              {selectedFields.map((f) => {
                let value: string | number = "";

                switch (f) {
                  case "memberName":
                    value = memberName;
                    break;

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
