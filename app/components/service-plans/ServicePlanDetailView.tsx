//app/components/service-plans/ServicePlanDetailView.tsx
'use client';

import Link from 'next/link';
import { Card } from '@/app/components/ui/card';
import { Fab } from '@/app/components/ui/fab';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/components/ui/dropdown-menu';
import { CalendarDays, ChevronRight, Copy, Layers3, Pencil, Trash, UserRound } from 'lucide-react';
import type { ServicePlan, Member, Song } from '@/app/lib/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getSectionColor } from '@/app/lib/sectionColors';

export interface ServicePlanDetailViewProps {
  plan: ServicePlan;
  members: Member[];
  songs: Song[];
  formattedDate: string;
  canEdit: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  router: AppRouterInstance;
  churchId: string | null;
}

export function ServicePlanDetailView({
  plan,
  members,
  songs,
  formattedDate,
  canEdit,
  onDuplicate,
  onDelete,
  router,
  churchId
}: ServicePlanDetailViewProps) {
    const hasServiceNotes = plan.notes.trim().length > 0;
    const totalSongs = plan.sections.reduce((acc, section) => acc + section.songIds.length, 0);

    return (
      <div className="space-y-6">
        <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/90 via-black/75 to-black/60 p-6 shadow-[0_18px_48px_rgba(0,0,0,0.34)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_40%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65">
                  <Layers3 className="h-3 w-3" />
                  {plan.sections.length} {plan.sections.length === 1 ? 'section' : 'sections'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 text-xs text-white/65">
                  <ChevronRight className="h-3 w-3" />
                  {totalSongs} {totalSongs === 1 ? 'song' : 'songs'}
                </span>
              </div>

              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {plan.title}
              </h1>

              <p className="flex items-center gap-1.5 text-sm text-white/55">
                <CalendarDays className="h-3.5 w-3.5" />
                {formattedDate}
              </p>
            </div>

            {churchId && (
              <Button asChild variant="outline" className="shrink-0 bg-black/60 border-white/20 text-white/75 hover:bg-white/5 hover:text-white/90">
                <Link href={`/church/${churchId}/service-plan`}>Back to Service Plans</Link>
              </Button>
            )}
          </div>
        </Card>

        {hasServiceNotes && (
          <Card className="relative overflow-hidden border-white/20 bg-gradient-to-br from-black/80 to-black/60 p-5 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.24)] animate-in fade-in slide-in-from-bottom-2 duration-500 [animation-delay:60ms]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_55%)]" />
            <div className="relative space-y-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40">Service Notes</p>
              <p className="whitespace-pre-wrap text-sm leading-6 text-white/75">
                {plan.notes}
              </p>
            </div>
          </Card>
        )}

        <div className="space-y-5">
          {plan.sections.map((section, sectionIndex) => {
            const member = members.find((m) => m.id === section.personId);
            const sectionColor = section.color ?? getSectionColor(section.title);
            const hasPerson = !!section.personId;
            const hasSongs = section.songIds.length > 0;
            const hasNotes = section.notes.trim().length > 0;

          return (
            <div
              key={section.id}
              className="relative overflow-hidden rounded-xl border border-white/15 bg-black/55 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.26)] animate-in fade-in slide-in-from-bottom-2 duration-500"
              style={{
                animationDelay: `${80 + sectionIndex * 50}ms`,
                borderLeftColor: sectionColor,
                borderLeftWidth: '3px',
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: sectionColor }}
              >
                <h2 className="text-sm font-semibold tracking-wide text-white/90 uppercase">
                  {section.title}
                </h2>
                <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-0.5 text-xs text-white/65">
                  {section.songIds.length} {section.songIds.length === 1 ? 'song' : 'songs'}
                </span>
              </div>

              <div className="space-y-3 px-4 py-4">
                {hasPerson && (
                  <div className="space-y-2 rounded-md border border-white/15 bg-black/50 p-3 backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Person</p>
                    <p className="flex items-center gap-2 text-white/80">
                      <UserRound className="h-4 w-4 text-white/50" />
                      {member
                        ? `${member.firstName} ${member.lastName}`
                        : 'Unknown Member'}
                    </p>
                  </div>
                )}

                {hasSongs && (
                  <div className="overflow-hidden rounded-md border border-white/10 bg-black/45">
                    <div className="divide-y divide-white/[0.06]">
                      {section.songIds.map((songId, songIndex) => {
                        const song = songs.find((s) => s.id === songId);
                        return (
                          <div
                            key={songId}
                            className="group flex items-center gap-3 px-3 py-2.5 transition-all hover:bg-sky-950/40 hover:shadow-[inset_0_0_0_1px_rgba(56,189,248,0.5)]"
                          >
                            <span className="w-5 shrink-0 text-center text-xs font-mono text-white/30 tabular-nums">
                              {songIndex + 1}
                            </span>
                            <p className="min-w-0 flex-1 truncate font-medium text-white/85 group-hover:text-white">
                              {song ? song.title : 'Unknown Song'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasNotes && (
                  <div className="space-y-2 rounded-md border border-white/15 bg-black/50 p-3 backdrop-blur-xl">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Notes</p>
                    <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                      {section.notes}
                    </p>
                  </div>
                )}

                {!hasPerson && !hasSongs && !hasNotes && (
                  <p className="text-sm text-white/35 italic">
                    No details for this section.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Fab type="menu" />
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="top"
            align="end"
            className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/20 p-1 rounded-md"
          >
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => {
                if (!churchId) return;
                router.push(`/church/${churchId}/service-plan/${plan.id}/edit`);
              }}
            >
              <Pencil className="h-4 w-4" />
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onSelect={(e) => e.preventDefault()}
              onClick={onDuplicate}
            >
              <Copy className="h-4 w-4" />
            </DropdownMenuItem>

            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onSelect={(e) => e.preventDefault()}
              onClick={onDelete}
            >
              <Trash className="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
