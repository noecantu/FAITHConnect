'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';

import {
  getServicePlanById,
  updateServicePlan,
  deleteServicePlan
} from '@/lib/servicePlans';

import type { ServicePlanSection } from '@/lib/types';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

import { ServicePlanSectionEditorSimple } from '@/components/service-plans/ServicePlanSectionEditorSimple';

export default function EditServicePlanPage() {
  const { id } = useParams();
  const router = useRouter();
  const churchId = useChurchId();

  const { isAdmin, isServiceManager } = useUserRoles(churchId ?? '');
  const canEdit = isAdmin || isServiceManager;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<ServicePlanSection[]>([]);

  useEffect(() => {
    if (!churchId || !id) return;

    async function load() {
      const plan = await getServicePlanById(churchId as string, id as string);

      if (plan) {
        setTitle(plan.title);
        setDate(plan.date ? plan.date.substring(0, 16) : '');
        setNotes(plan.notes || '');
        setSections(plan.sections || []);
      }

      setLoading(false);
    }

    load();
  }, [churchId, id]);

  if (!churchId || loading) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="p-6">
        <PageHeader title="Edit Service Plan" />
        <p className="text-muted-foreground">
          You do not have permission to edit service plans.
        </p>
      </div>
    );
  }

  async function handleSave() {
    if (!title.trim()) return;

    setSaving(true);

    const updated = {
      title: title.trim(),
      date: date ? new Date(date).toISOString() : '',
      notes: notes.trim(),
      sections,
      updatedAt: Date.now()
    };

    await updateServicePlan(churchId as string, id as string, updated);

    setSaving(false);
    router.push(`/service-plan/${id}`);
  }

  async function handleDelete() {
    await deleteServicePlan(churchId as string, id as string);
    router.push('/service-plan');
  }

  return (
    // ⭐ THE ONLY CHANGE YOU NEEDED
    <div className="bg-background text-foreground min-h-screen">
      <div className="space-y-6">
        <PageHeader title="Edit Service Plan">
          <div className="flex items-center gap-2">
            <Link href={`/service-plan/${id}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Back to Plan
              </Button>
            </Link>

            <Button onClick={handleSave} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>

            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </div>
        </PageHeader>

        <Card className="p-6 space-y-4">

          <div>
            <label className="block text-sm font-medium mb-1">Service Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date & Time</label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Sections</label>

            <ServicePlanSectionEditorSimple
              sections={sections}
              onChange={setSections}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions, transitions, or reminders."
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center">
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={() => router.push(`/service-plan/${id}`)}
            >
              Cancel
            </Button>

            <Button
              className="w-full sm:w-auto"
              onClick={handleSave}
              disabled={saving || !title.trim()}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
