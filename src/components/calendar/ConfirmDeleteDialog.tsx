import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StandardDialogLayout } from "@/components/layout/StandardDialogLayout";

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <StandardDialogLayout
        title="Delete Event"
        description="Are you sure you want to delete this event? This action cannot be undone."
        onClose={() => onOpenChange(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm}>
              Delete
            </Button>
          </>
        }
      />
    </Dialog>
  );
}
