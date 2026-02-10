'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { getServicePlanById } from '@/app/lib/servicePlans';
import type { ServicePlan } from '@/app/lib/types';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { format } from 'date-fns';
import { useMembers } from '@/app/hooks/useMembers';
import { useSongs } from '@/app/hooks/useSongs';
import { Separator } from '@/app/components/ui/separator';
import { Fab } from "@/app/components/ui/fab";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { AlertDialogHeader, AlertDialogFooter } from '@/app/components/ui/alert-dialog';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@radix-ui/react-alert-dialog';
import { Pencil, Copy, Trash } from 'lucide-react';
import { useRouter } from "next/navigation";

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

  const formattedDate = plan.date
    ? format(new Date(plan.date), 'M/d/yy, h:mm a')
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader title={plan.title} subtitle={formattedDate}>
      </PageHeader>

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
                  sectionBgColors[normalize(section.title)] ?? "transparent",
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
            className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/10 p-1"
          >
            {/* Edit */}
            <DropdownMenuItem
              className="flex items-center justify-center p-2"
              onClick={() => router.push(`/service-plan/${plan.id}/edit`)}
            >
              <Pencil className="h-4 w-4" />
            </DropdownMenuItem>

            {/* Duplicate */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="flex items-center justify-center p-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Copy className="h-4 w-4" />
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Duplicate this service plan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A new copy of “{plan.title}” will be created with the same sections.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      // TODO: implement duplicateServicePlan()
                    }}
                  >
                    Duplicate
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {/* Delete */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  className="flex items-center justify-center p-2"
                  onSelect={(e) => e.preventDefault()}
                >
                  <Trash className="h-4 w-4" />
                </DropdownMenuItem>
              </AlertDialogTrigger>

              <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this service plan?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently remove “{plan.title}”.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      // TODO: implement deleteServicePlan()
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

    </div>
  );
}
