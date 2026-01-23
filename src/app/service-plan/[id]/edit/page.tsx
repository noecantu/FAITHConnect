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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

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
        </Card>
      </div>

      {canEdit && (
        <>
          {/* Save FAB */}
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

          {/* Delete FAB */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="
                  fixed bottom-6 right-20 h-10 w-10 rounded-full shadow-xl
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m5-3v3"
                  />
                </svg>
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Service Plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this service plan and all its sections.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={handleDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </>
      )}

    </div>
  );
}
