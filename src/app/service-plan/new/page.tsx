'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createServicePlan } from '@/lib/servicePlans';
import type { ServicePlan, ServicePlanSection } from '@/lib/types';
import { useChurchId } from '@/hooks/useChurchId';
import { useUserRoles } from '@/hooks/useUserRoles';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ServicePlanSectionEditorSimple } from '@/components/service-plans/ServicePlanSectionEditorSimple';
import { useAuth } from '@/hooks/useAuth';

export default function NewServicePlanPage() {
  const router = useRouter();
  const churchId = useChurchId();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isServiceManager, loading: rolesLoading } =
    useUserRoles(churchId);

  const canCreate = isAdmin || isServiceManager;

  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [sections, setSections] = useState<ServicePlanSection[]>([]);

  if (!churchId || rolesLoading || authLoading) {
    return (
      <div className="p-6">
        <PageHeader title="New Service Plan" />
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!canCreate) {
    return (
      <div className="p-6">
        <PageHeader title="New Service Plan" />
        <p className="text-muted-foreground">
          You do not have permission to create service plans.
        </p>
      </div>
    );
  }

  const churchIdSafe = churchId as string;

  async function handleSave() {
    if (!title.trim() || !date || !user) return;
  
    setSaving(true);
  
    const newPlan: Omit<ServicePlan, 'id'> = {
      title: title.trim(),
      date: new Date(date).toISOString(),
      notes: notes.trim(),
      sections: sections ?? [],
      createdBy: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  
    try {
      const plan = await createServicePlan(churchIdSafe, newPlan);
      router.push(`/service-plan/${plan.id}`);
    } finally {
      setSaving(false);
    }
  }  

  return (
    <div className="bg-background text-foreground min-h-screen">
    <div className="space-y-6 p-6">
      <PageHeader title="New Service Plan">
        <div className="flex items-center gap-2">
          <Link href="/service-plan">
            <Button variant="outline" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Plans
            </Button>
          </Link>

          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </PageHeader>

      <Card className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sunday Service, Youth Night, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <Input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <Textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes for this service…"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Sections</label>
          <ServicePlanSectionEditorSimple
            sections={sections}
            onChange={setSections}
          />
        </div>
      </Card>

      {/* Floating Save FAB */}
      <Button
        onClick={handleSave}
        disabled={saving || !title.trim()}
        className="
          fixed bottom-6 right-6 h-10 w-10 rounded-full shadow-xl
          bg-white/10 backdrop-blur-sm border border-white/10
          text-white
          hover:bg-white/25 active:bg-white/10
          flex items-center justify-center p-0
        "
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </Button>

      </div>
      </div>
  );
}
