import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface StandardDialogLayoutProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  children?: React.ReactNode; // ← make optional
  className?: string;
  contentClassName?: string;
  onClose: () => void;
}

export function StandardDialogLayout({
  title,
  description,
  footer,
  children,
  className = "",
  contentClassName = "",
  onClose,
}: StandardDialogLayoutProps) {
  return (
    <DialogContent
      className={`w-[95vw] max-w-lg max-h-[85dvh] flex flex-col p-0 ${className}`}
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Header */}
      <DialogHeader className="shrink-0 px-6 pt-6">
        <DialogTitle className="focus:outline-none">{title}</DialogTitle>
        {description && <DialogDescription>{description}</DialogDescription>}
      </DialogHeader>

      {/* Scrollable Middle */}
      <div className={`flex-grow overflow-y-auto px-6 py-4 ${contentClassName}`}>
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
