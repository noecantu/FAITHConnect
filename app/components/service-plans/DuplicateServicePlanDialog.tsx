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
import { duplicateServicePlan } from '@/app/lib/servicePlans';
import { toast } from '@/app/hooks/use-toast';
import type { ServicePlan } from '@/app/lib/types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface DuplicateServicePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ServicePlan;
  churchId: string;
  router: AppRouterInstance;
}

export function DuplicateServicePlanDialog({
  open,
  onOpenChange,
  plan,
  churchId,
  router,
}: DuplicateServicePlanDialogProps) {
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

          <DialogFooter className="shrink-0 border-t px-6 pb-6 pt-4 flex justify-end">
            <Button
              onClick={async () => {
                const newPlan = await duplicateServicePlan(churchId, plan);

                toast({
                  title: 'Service Plan Duplicated',
                  description: `A copy of “${plan.title}” has been created.`,
                });

                onOpenChange(false);
                router.push(`/service-plan/${newPlan.id}`);
              }}
            >
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
