'use client';

import {
  Dialog,
  DialogPortal,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { deleteServicePlan } from '@/app/lib/servicePlans';
import { toast } from '@/app/hooks/use-toast';
import type { ServicePlan } from '@/app/lib/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface DeleteServicePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ServicePlan;
  churchId: string;
  router: AppRouterInstance;
}

export function DeleteServicePlanDialog({
  open,
  onOpenChange,
  plan,
  churchId,
  router,
}: DeleteServicePlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogPortal>
        <DialogContent
          className="w-[95vw] max-w-md max-h-[85dvh] flex flex-col p-0"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="shrink-0 px-6 pt-6">
            <DialogTitle>Delete this service plan?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently remove “{plan.title}”.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-grow px-6 py-4">
            <p className="text-sm text-muted-foreground">
              Any references to this plan will no longer be available.
            </p>
          </div>

          <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end">
            <Button
              variant="destructive"
              onClick={async () => {
                await deleteServicePlan(churchId, plan.id);

                toast({
                  title: 'Service Plan Deleted',
                  description: `“${plan.title}” has been removed.`,
                  variant: 'destructive',
                });

                onOpenChange(false);
                router.push('/service-plan');
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
