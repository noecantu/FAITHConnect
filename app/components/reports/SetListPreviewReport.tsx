'use client';

import { Card } from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import type { SetList } from "@/app/lib/types";
import { getSectionColor } from "@/app/lib/sectionColors";

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

  return (
    <div className="space-y-6">
      {(setList.serviceType ||
        setList.serviceNotes?.theme ||
        setList.serviceNotes?.scripture ||
        setList.serviceNotes?.notes) && (
        <Card className="p-4 space-y-2 bg-black border-white/25">
          <h2 className="text-lg font-semibold">Overview</h2>

          {setList.serviceType && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Service Type:</span>{" "}
              {setList.serviceType}
            </p>
          )}

          {setList.serviceNotes?.theme && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Theme:</span>{" "}
              {setList.serviceNotes.theme}
            </p>
          )}

          {setList.serviceNotes?.scripture && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Scripture:</span>{" "}
              {setList.serviceNotes.scripture}
            </p>
          )}

          {setList.serviceNotes?.notes && (
            <div className="space-y-1 rounded-md border border-white/15 bg-black/60 p-3 backdrop-blur-xl">
              <p className="text-sm font-medium text-foreground">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {setList.serviceNotes.notes}
              </p>
            </div>
          )}
        </Card>
      )}

      {setList.sections.map((section) => (
        <Card
          key={section.id}
          className="p-4 space-y-4"
          style={{
            backgroundColor: section.color ?? getSectionColor(section.title),
          }}
        >
          <h2 className="text-lg font-semibold">
            {section.title}{" "}
            <span className="text-muted-foreground text-sm">
              ({section.songs.length} {section.songs.length === 1 ? "Song" : "Songs"})
            </span>
          </h2>

          <Separator className="my-2 bg-white/30" />

          <div className="space-y-3">
            {section.songs.map((song) => (
              <Card
                key={song.id || song.songId}
                className="relative p-4 bg-black/80 backdrop-blur-xl border border-white/20"
              >
                <div>
                  <h3 className="font-medium">{song.title}</h3>

                  <p className="text-sm text-muted-foreground">
                    Key: {song.key || "-"} • {song.bpm ?? "-"} BPM • {song.timeSignature ?? "-"} Time
                  </p>

                  {song.notes && (
                    <div className="mt-2 space-y-1 rounded-md border border-white/15 bg-black/60 p-3 backdrop-blur-xl">
                      <p className="text-xs font-medium text-foreground">Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {song.notes}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}

            {section.songs.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                No songs in this section.
              </p>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
