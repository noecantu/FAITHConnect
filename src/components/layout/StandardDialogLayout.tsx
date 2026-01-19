import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface StandardDialogLayoutProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function StandardDialogLayout({
  title,
  description,
  footer,
  children,
  className = "",
}: StandardDialogLayoutProps) {
  return (
    <DialogContent
      className={`w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0 ${className}`}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      {/* Header */}
      <DialogHeader className="shrink-0 px-6 pt-6">
        <DialogTitle className="focus:outline-none">{title}</DialogTitle>
        {description && (
          <DialogDescription>{description}</DialogDescription>
        )}
      </DialogHeader>

      {/* Scrollable Middle */}
      <div className="flex-grow overflow-y-auto px-6 py-4">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <DialogFooter className="border-t px-6 pb-6 pt-4 flex justify-end">
          {footer}
        </DialogFooter>
      )}
    </DialogContent>
  );
}
