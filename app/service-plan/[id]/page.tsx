'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { deleteServicePlan, duplicateServicePlan, getServicePlanById } from '@/app/lib/servicePlans';
import type { ServicePlan } from '@/app/lib/types';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { format } from 'date-fns';
import { useMembers } from '@/app/hooks/useMembers';
import { useSongs } from '@/app/hooks/useSongs';
import { Separator } from '@/app/components/ui/separator';
import { Fab } from "@/app/components/ui/fab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/app/components/ui/dropdown-menu';

import { Pencil, Copy, Trash } from 'lucide-react';
import { useRouter } from "next/navigation";
import { toast } from '@/app/hooks/use-toast';
import { Button } from '@/app/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

const normalize = (str: string) =>
  str.replace(/\s+/g, "").toLowerCase();

const sectionBgColors: Record<string, string> = {
  praise: "rgba(59, 130, 246, 0.10)",      // Blue
  worship: "rgba(251, 146, 60, 0.10)",     // Orange
  offering: "rgba(239, 68, 68, 0.10)",     // Red
  altarcall: "rgba(34, 197, 94, 0.10)",    // Green
  custom: "rgba(234, 179, 8, 0.10)",       // Yellow
};

export default function ServicePlanDetailPage() {
  const { id } = useParams();
  const churchId = useChurchId();
  const { members, loading: membersLoading } = useMembers(churchId);
  const { songs, loading: songsLoading } = useSongs(churchId);
  const router = useRouter();

  const {
    isAdmin,
    isServiceManager,
    isMusicManager,
    isMusicMember,
    loading: rolesLoading
  } = useUserRoles(churchId);

  const canView = isAdmin || isServiceManager || isMusicManager || isMusicMember;
  const canEdit = isAdmin || isServiceManager;

  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getServicePlanById(churchId, id as string);
      setPlan(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  if (!churchId || rolesLoading || loading || songsLoading || membersLoading) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plan" />
        <p className="text-muted-foreground">Loading service plan…</p>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plan" />
        <p className="text-muted-foreground">
          You do not have permission to view this service plan.
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6">
        <PageHeader title="Service Plan" />
        <p className="text-muted-foreground">Service Plan not found.</p>
      </div>
    );
  }

  // ⭐ NEW — use canonical derived field
  const formattedDate = plan.dateTime
    ? format(plan.dateTime, 'M/d/yy, h:mm a')
    : '—';

return (
  <>
    <div className="space-y-6">
      <PageHeader title={plan.title} subtitle={formattedDate} />

      {/* Sections */}
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

      {/* Menu FAB */}
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
            {/* Edit */}
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => router.push(`/service-plan/${plan.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
            </DropdownMenuItem>

            {/* Duplicate */}
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onSelect={(e) => e.preventDefault()}
              onClick={() => setDuplicateOpen(true)}
            >
              <Copy className="h-4 w-4" />
            </DropdownMenuItem>

            {/* Delete */}
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onSelect={(e) => e.preventDefault()}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash className="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>

    {/* Duplicate Dialog (uses same Dialog style as form) */}
    <Dialog open={duplicateOpen} onOpenChange={setDuplicateOpen}>
      <DialogContent
        className="w-[95vw] max-w-md max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Duplicate this service plan?</DialogTitle>
          <DialogDescription>
            A new copy of “{plan.title}” will be created with the same sections.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow px-6 py-4">
          <p className="text-sm text-muted-foreground">
            You can edit the duplicated plan after it is created.
          </p>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDuplicateOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={async () => {
              const newPlan = await duplicateServicePlan(churchId, plan);

              toast({
                title: 'Service Plan Duplicated',
                description: `A copy of “${plan.title}” has been created.`,
              });

              setDuplicateOpen(false);
              router.push(`/service-plan/${newPlan.id}`);
            }}
          >
            Duplicate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Dialog (same visual language) */}
    <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <DialogContent
        className="w-[95vw] max-w-md max-h-[85dvh] flex flex-col p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle>Delete this service plan?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently remove “
            {plan.title}”.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow px-6 py-4">
          <p className="text-sm text-muted-foreground">
            Any references to this plan will no longer be available.
          </p>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await deleteServicePlan(churchId, plan.id);

              toast({
                title: 'Service Plan Deleted',
                description: `“${plan.title}” has been removed.`,
                variant: 'destructive',
              });

              setDeleteOpen(false);
              router.push('/service-plan');
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);

}
