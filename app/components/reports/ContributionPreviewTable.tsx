'use client';

import { Member, Contribution } from "@/app/lib/types";
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";

interface Props {
  contributions: Contribution[];
  members: Member[];
}

export function ContributionPreviewTable({ contributions, members }: Props) {
  const {
    page,
    setPage,
    start,
    end,
    visible,
    totalPages,
    total,
  } = usePreviewPagination(contributions, 20);

  if (!total) {
    return (
      <p className="text-sm text-muted-foreground">
        No contributions found.
      </p>
    );
  }

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
          {visible.map((c) => {
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

      <PreviewPaginationFooter
        start={start}
        end={end}
        total={total}
        page={page}
        totalPages={totalPages}
        setPage={setPage}
        label="contributions"
      />
    </div>
  );
}
