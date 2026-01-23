'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getServicePlanById } from '@/lib/servicePlans';
import type { ServicePlan } from '@/lib/types';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';
import { useMembers } from '@/hooks/useMembers';
import { useSongs } from '@/hooks/useSongs';
import { Separator } from '@/components/ui/separator';

export default function ServicePlanDetailPage() {
  const { id } = useParams();
  const churchId = useChurchId();
  const { members, loading: membersLoading } = useMembers(churchId);
  const { songs, loading: songsLoading } = useSongs(churchId);

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
        <div className="flex items-center gap-2">
          <Link href="/service-plan">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Service Plans
            </Button>
          </Link>

          {canEdit && (
            <Button asChild>
              <Link href={`/service-plan/${plan.id}/edit`}>
                Edit Service Plan
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      {/* Sections */}
      <div className="space-y-6">
        {plan.sections.map((section) => {
          const member = members.find((m) => m.id === section.personId);
          const hasPerson = !!section.personId;
          const hasSongs = section.songIds.length > 0;
          const hasNotes = section.notes.trim().length > 0;

          return (
            <Card key={section.id} className="p-5 space-y-2">
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
    </div>
  );
}
