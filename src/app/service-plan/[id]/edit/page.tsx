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
  deleteServicePlan,
  createServicePlan
} from '@/lib/servicePlans';

import type { ServicePlanSection } from '@/lib/types';
import { Fab } from "@/components/ui/fab";

import { ServicePlanSectionEditorSimple } from '@/components/service-plans/ServicePlanSectionEditorSimple';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Pencil, Copy, Trash } from 'lucide-react';

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

      {/* Back FAB */}
      <Fab
        type="back"
        position="bottom-left"
        onClick={() => router.push(`/service-plan/${id}`)}
      />

      {/* Menu FAB */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Fab type="menu" />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="end"
          className="min-w-0 w-10 bg-white/10 backdrop-blur-sm border border-white/10 p-1"
        >
          {/* Save */}
          <DropdownMenuItem
            className="flex items-center justify-center p-2"
            onClick={handleSave}
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
                  A new copy of “{title}” will be created with the same sections.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    const updated = {
                      title: `${title} (Copy)`,
                      date: date ? new Date(date).toISOString() : "",
                      notes,
                      sections,
                      updatedAt: Date.now(),
                    };

                    const newPlan = await createServicePlan(churchId as string, {
                      title: `${title} (Copy)`,
                      date: date ? new Date(date).toISOString() : "",
                      notes,
                      sections,
                      createdBy: "system", // optional, depending on your model
                    });
                    
                    router.push(`/service-plan/${newPlan.id}`);
                  }}
                >
                  Duplicate
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Separator */}
          <DropdownMenuSeparator className="h-4 w-px bg-white/20 mx-auto" />

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                className="flex items-center justify-center p-2 text-destructive"
                onSelect={(e) => e.preventDefault()}
              >
                <Trash className="h-4 w-4" />
              </DropdownMenuItem>
            </AlertDialogTrigger>

            <AlertDialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this service plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete “{title}”.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

    </div>
  );
}
