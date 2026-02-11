'use client';

import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { Separator } from '@/app/components/ui/separator';
import { Fab } from '@/app/components/ui/fab';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/components/ui/dropdown-menu';
import { Pencil, Copy, Trash } from 'lucide-react';
import type { ServicePlan, Member, Song } from '@/app/lib/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface ServicePlanDetailViewProps {
  plan: ServicePlan;
  members: Member[];
  songs: Song[];
  formattedDate: string;
  canEdit: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  router: AppRouterInstance;
}

const normalize = (str: string) =>
  str.replace(/\s+/g, "").toLowerCase();

const sectionBgColors: Record<string, string> = {
  praise: "rgba(59, 130, 246, 0.10)",
  worship: "rgba(251, 146, 60, 0.10)",
  offering: "rgba(239, 68, 68, 0.10)",
  altarcall: "rgba(34, 197, 94, 0.10)",
  custom: "rgba(234, 179, 8, 0.10)",
};

export function ServicePlanDetailView({
  plan,
  members,
  songs,
  formattedDate,
  canEdit,
  onDuplicate,
  onDelete,
  router,
}: ServicePlanDetailViewProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={plan.title} subtitle={formattedDate} />

      <div className="space-y-6">
        {plan.sections.map((section) => {
          const member = members.find((m) => m.id === section.personId);
          const hasPerson = !!section.personId;
          const hasSongs = section.songIds.length > 0;
          const hasNotes = section.notes.trim().length > 0;

          return (
            <Card
              key={section.id}
              className="p-5 space-y-2"
              style={{
                backgroundColor:
                  sectionBgColors[normalize(section.title)] ?? 'transparent',
              }}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                {section.title}
              </h2>

              <Separator />

              <div className="space-y-4">
                {hasPerson && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Person</p>
                    <p className="text-muted-foreground">
                      {member
                        ? `${member.firstName} ${member.lastName}`
                        : 'Unknown Member'}
                    </p>
                  </div>
                )}

                {hasSongs && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      Music ({section.songIds.length}{' '}
                      {section.songIds.length === 1 ? 'Song' : 'Songs'})
                    </p>

                    <div className="space-y-2">
                      {section.songIds.map((songId) => {
                        const song = songs.find((s) => s.id === songId);
                        return (
                          <Card key={songId} className="p-3 bg-muted/40">
                            <p className="font-medium">
                              {song ? song.title : 'Unknown Song'}
                            </p>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {hasNotes && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Notes</p>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {section.notes}
                    </p>
                  </div>
                )}

                {!hasPerson && !hasSongs && !hasNotes && (
                  <p className="text-sm text-muted-foreground italic">
                    No details for this section.
                  </p>
                )}
              </div>
            </Card>
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
            className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/10 p-1 rounded-md"
          >
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => router.push(`/service-plan/${plan.id}/edit`)}
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
