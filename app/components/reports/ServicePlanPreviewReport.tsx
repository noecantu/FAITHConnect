'use client';

import { format } from "date-fns";
import { ReportContainer } from "@/app/components/reports/ReportContainer";
import type { Member, ServicePlan, Song } from "@/app/lib/types";

type Props = {
  plan: ServicePlan | null;
  members: Member[];
  songs: Song[];
};

export function ServicePlanPreviewReport({ plan, members, songs }: Props) {
  if (!plan) {
    return (
      <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
        Select a service plan to preview the report.
      </div>
    );
  }

  const hasServiceNotes = plan.notes.trim().length > 0;
  const rows = plan.sections.flatMap((section) => {
    const member = members.find((m) => m.id === section.personId);
    const personName = section.personId
      ? member
        ? `${member.firstName} ${member.lastName}`
        : "Unknown Member"
      : "";

    if (section.songIds.length === 0) {
      return [
        {
          section: section.title,
          person: personName,
          music: "No songs",
          notes: section.notes?.trim() || "",
        },
      ];
    }

    return section.songIds.map((songId, index) => {
      const song = songs.find((s) => s.id === songId);
      return {
        section: index === 0 ? section.title : "",
        person: index === 0 ? personName : "",
        music: song ? song.title : "Unknown Song",
        notes: index === 0 ? (section.notes?.trim() || "") : "",
      };
    });
  });

  return (
    <ReportContainer>
      <div className="space-y-4">
        <div className="rounded-md border border-white/20 bg-black/40 p-4 text-sm text-white/85">
          <p className="font-semibold text-white">{plan.title}</p>
          <p className="text-white/70">Service Date: {format(plan.dateTime, "MM/dd/yyyy h:mm a")}</p>
        </div>

        {hasServiceNotes && (
          <section className="rounded-md border border-white/20 bg-black/40 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/80">Overview</h3>
            <p className="whitespace-pre-wrap text-sm text-white/85">
              <span className="font-medium text-white">Service Notes:</span> {plan.notes}
            </p>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Sections</h3>
          <div className="overflow-x-auto rounded-md border border-white/20 bg-black/50 backdrop-blur-xl w-full min-h-[360px]">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-slate-800 border-b border-white/50">
                <tr>
                  <th className="p-3 text-left font-medium text-white/80">Section</th>
                  <th className="p-3 text-left font-medium text-white/80">Person</th>
                  <th className="p-3 text-left font-medium text-white/80">Music</th>
                  <th className="p-3 text-left font-medium text-white/80">Section Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.section || "row"}-${row.music}-${index}`} className="border-b border-white/20 hover:bg-white/5 transition-colors">
                    <td className="p-3 align-top text-white/90">{row.section}</td>
                    <td className="p-3 align-top text-white/90">{row.person}</td>
                    <td className="p-3 align-top text-white/90">{row.music}</td>
                    <td className="p-3 align-top whitespace-pre-wrap text-white/90">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </ReportContainer>
  );
}
