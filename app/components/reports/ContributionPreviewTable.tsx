'use client';

import { Member, Contribution } from "@/app/lib/types";
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";
import { ReportContainer } from "@/app/components/reports/ReportContainer";

interface Props {
  contributions: Contribution[];
  members: Member[];
  selectedFields: string[];
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
    <ReportContainer
      footer={
        <PreviewPaginationFooter
          start={start}
          end={end}
          total={total}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          label="records"
        />
      }
    >
      <div className="overflow-x-auto rounded-md border border-white/20 bg-black/20 backdrop-blur-xl w-full min-h-[360px]">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-slate-800 border-b border-white/50">
            <tr>
              <th className="p-3 text-left font-medium text-white/80">Member</th>
              <th className="p-3 text-left font-medium text-white/80">Amount</th>
              <th className="p-3 text-left font-medium text-white/80">Date</th>
              <th className="p-3 text-left font-medium text-white/80">Category</th>
              <th className="p-3 text-left font-medium text-white/80">Type</th>
              <th className="p-3 text-left font-medium text-white/80">Notes</th>
            </tr>
          </thead>

          <tbody>
            {visible.map((c) => {
              const member = members.find((m) => m.id === c.memberId);
              const memberName = member
                ? `${member.firstName} ${member.lastName}`
                : c.memberName ?? "Unknown";

              return (
                <tr
                  key={c.id}
                  className="border-b border-white/20 hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 text-white/90">{memberName}</td>
                  <td className="p-3 text-white/90">${c.amount.toFixed(2)}</td>
                  <td className="p-3 text-white/90">
                    {new Date(c.date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-white/90">{c.category ?? ""}</td>
                  <td className="p-3 text-white/90">{c.contributionType ?? ""}</td>
                  <td className="p-3 text-white/90">{c.notes ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ReportContainer>
  );
}
