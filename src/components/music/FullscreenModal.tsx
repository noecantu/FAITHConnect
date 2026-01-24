"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface FullscreenModalProps {
  open: boolean;
  onClose: (open: boolean) => void;
  content: string;
  title: string;
}

export default function FullscreenModal({
  open,
  onClose,
  content,
  title,
}: FullscreenModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        aria-describedby={undefined}
        className="
          fixed inset-0
          w-screen h-screen
          p-0 m-0
          bg-black text-white
          overflow-y-auto
          rounded-none
          transform-none
          border-none
          shadow-none
        "
        style={{
          transform: "none",
          WebkitOverflowScrolling: "touch",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Required for accessibility */}
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>

        {/* Actual fullscreen content */}
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-semibold">{title}</h1>

          <pre className="whitespace-pre-wrap text-2xl leading-relaxed">
            {content}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}
