'use client';

import { format } from "date-fns";
import { ReportContainer } from "@/app/components/reports/ReportContainer";
import type { SetList } from "@/app/lib/types";

type Props = {
  setList: SetList | null;
};

export function SetListPreviewReport({ setList }: Props) {
  if (!setList) {
    return (
      <div className="rounded-md border border-white/20 bg-black/30 p-4 text-sm text-muted-foreground">
        Select a set list to preview the report.
      </div>
    );
  }

  const rows = setList.sections.flatMap((section) => {
    if (section.songs.length === 0) {
      return [
        {
          section: section.title,
          song: "-",
          key: "-",
          bpm: "-",
          notes: "No songs in this section",
        },
      ];
    }

    return section.songs.map((song, index) => ({
      section: index === 0 ? section.title : "",
      song: song.title ?? "-",
      key: song.key ?? "-",
      bpm: song.bpm != null ? String(song.bpm) : "-",
      notes: song.notes?.trim() || "",
    }));
  });

  return (
    <ReportContainer>
      <div className="space-y-4">
        <div className="rounded-md border border-white/20 bg-black/40 p-4 text-sm text-white/85">
          <p className="font-semibold text-white">{setList.title}</p>
          <p className="text-white/70">Service Date: {format(setList.dateTime, "MM/dd/yyyy h:mm a")}</p>
        </div>

        {(setList.serviceType ||
          setList.serviceNotes?.theme ||
          setList.serviceNotes?.scripture ||
          setList.serviceNotes?.notes) && (
          <section className="rounded-md border border-white/20 bg-black/40 p-4">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/80">Overview</h3>
            <div className="grid gap-1 text-sm text-white/85">
              {setList.serviceType && <p><span className="font-medium text-white">Service Type:</span> {setList.serviceType}</p>}
              {setList.serviceNotes?.theme && <p><span className="font-medium text-white">Theme:</span> {setList.serviceNotes.theme}</p>}
              {setList.serviceNotes?.scripture && <p><span className="font-medium text-white">Scripture:</span> {setList.serviceNotes.scripture}</p>}
              {setList.serviceNotes?.notes && <p className="whitespace-pre-wrap"><span className="font-medium text-white">Notes:</span> {setList.serviceNotes.notes}</p>}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Songs</h3>
          <div className="overflow-x-auto rounded-md border border-white/20 bg-black/50 backdrop-blur-xl w-full min-h-[360px]">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-slate-800 border-b border-white/50">
                <tr>
                  <th className="p-3 text-left font-medium text-white/80">Section</th>
                  <th className="p-3 text-left font-medium text-white/80">Song</th>
                  <th className="p-3 text-left font-medium text-white/80">Key</th>
                  <th className="p-3 text-left font-medium text-white/80">BPM</th>
                  <th className="p-3 text-left font-medium text-white/80">Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={`${row.section || "row"}-${row.song}-${index}`} className="border-b border-white/20 transition-all hover:bg-sky-950/40 hover:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]">
                    <td className="p-3 align-top text-white/90">{row.section}</td>
                    <td className="p-3 align-top text-white/90">{row.song}</td>
                    <td className="p-3 align-top text-white/90">{row.key}</td>
                    <td className="p-3 align-top text-white/90">{row.bpm}</td>
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
