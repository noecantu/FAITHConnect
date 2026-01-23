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

export default function ServicePlanDetailPage() {
  // -----------------------------
  // ALL HOOKS MUST RUN FIRST
  // -----------------------------
  const { id } = useParams();
  const churchId = useChurchId();

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

  // -----------------------------
  // DATA LOADING
  // -----------------------------
  useEffect(() => {
    if (!churchId || !id) return;

    const load = async () => {
      const data = await getServicePlanById(churchId, id as string);
      setPlan(data);
      setLoading(false);
    };

    load();
  }, [churchId, id]);

  // -----------------------------
  // CONDITIONAL RETURNS AFTER HOOKS
  // -----------------------------
  if (!churchId || rolesLoading || loading) {
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

  // -----------------------------
  // RENDER
  // -----------------------------
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
        {plan.sections.map((section) => (
          <Card key={section.id} className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {section.title}{' '}
                <span className="text-muted-foreground text-sm">
                  ({section.songIds.length}{' '}
                  {section.songIds.length === 1 ? 'Song' : 'Songs'})
                </span>
              </h2>

              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/service-plan/${plan.id}/edit#section-${section.id}`}>
                    Edit
                  </Link>
                </Button>
              )}
            </div>

            <div className="space-y-3">
              {section.songIds.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No songs in this section.
                </p>
              )}

              {section.songIds.map((songId) => (
                <Card key={songId} className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{songId}</p>

                    {canEdit && (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/service-plan/${plan.id}/edit?song=${songId}`}>
                          Edit
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {plan.notes && (
        <Card className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Service Notes</h3>

            {canEdit && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/service-plan/${plan.id}/edit#notes`}>
                  Edit
                </Link>
              </Button>
            )}
          </div>

          <p className="text-muted-foreground whitespace-pre-wrap">
            {plan.notes}
          </p>
        </Card>
      )}
    </div>
  );
}
