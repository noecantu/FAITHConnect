'use client';

import { Member, Contribution } from "@/app/lib/types";
import { usePreviewPagination } from "@/app/hooks/usePreviewPagination";
import { PreviewPaginationFooter } from "@/app/components/layout/PreviewPaginationFooter";
import { ReportContainer } from "@/app/components/reports/ReportContainer";
import type {
  ContributionBreakdown,
  ContributionBreakdownRow,
} from "@/app/hooks/useContributionReport";

interface Props {
  contributions: Contribution[];
  members: Member[];
  selectedFields: string[];
  breakdown: ContributionBreakdown;
  breakdownRows: ContributionBreakdownRow[];
  useGroupedView?: boolean;
}

const breakdownLabelMap: Record<ContributionBreakdown, string> = {
  member: "Member",
  church: "Church",
  region: "Region",
  district: "District",
};

export function ContributionPreviewTable({
  contributions,
  members,
  breakdown,
  breakdownRows,
  useGroupedView = false,
}: Props) {
  const sourceRows = useGroupedView ? breakdownRows : contributions;

  const {
    page,
    setPage,
    start,
    end,
    visible,
    totalPages,
    total,
  } = usePreviewPagination(sourceRows, 20);

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
      <div className="overflow-x-auto rounded-md border border-white/20 bg-black/50 backdrop-blur-xl w-full min-h-[360px]">
        <table className="w-full min-w-max text-sm">
          <thead className="bg-slate-800 border-b border-white/50">
            <tr>
              {useGroupedView ? (
                <>
                  <th className="p-3 text-left font-medium text-white/80">{breakdownLabelMap[breakdown]}</th>
                  <th className="p-3 text-left font-medium text-white/80">Total Amount</th>
                  <th className="p-3 text-left font-medium text-white/80">Contributions</th>
                  <th className="p-3 text-left font-medium text-white/80">Average Gift</th>
                </>
              ) : (
                <>
                  <th className="p-3 text-left font-medium text-white/80">Member</th>
                  <th className="p-3 text-left font-medium text-white/80">Amount</th>
                  <th className="p-3 text-left font-medium text-white/80">Date</th>
                  <th className="p-3 text-left font-medium text-white/80">Category</th>
                  <th className="p-3 text-left font-medium text-white/80">Type</th>
                  <th className="p-3 text-left font-medium text-white/80">Notes</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {useGroupedView
              ? (visible as ContributionBreakdownRow[]).map((row) => (
                  <tr
                    key={row.key}
                    className="border-b border-white/20 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-3 text-white/90">{row.label}</td>
                    <td className="p-3 text-white/90">${row.totalAmount.toFixed(2)}</td>
                    <td className="p-3 text-white/90">{row.contributionCount}</td>
                    <td className="p-3 text-white/90">${row.averageAmount.toFixed(2)}</td>
                  </tr>
                ))
              : (visible as Contribution[]).map((contribution) => {
                  const member = members.find((m) => m.id === contribution.memberId);
                  const memberName = member
                    ? `${member.firstName} ${member.lastName}`
                    : contribution.memberName ?? "Unknown";

                  return (
                    <tr
                      key={contribution.id}
                      className="border-b border-white/20 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-3 text-white/90">{memberName}</td>
                      <td className="p-3 text-white/90">${contribution.amount.toFixed(2)}</td>
                      <td className="p-3 text-white/90">
                        {new Date(contribution.date).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-white/90">{contribution.category ?? ""}</td>
                      <td className="p-3 text-white/90">{contribution.contributionType ?? ""}</td>
                      <td className="p-3 text-white/90">{contribution.notes ?? ""}</td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </ReportContainer>
  );
}
