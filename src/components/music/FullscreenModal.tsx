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
          border-none
          shadow-none
          !max-w-none !max-h-none
          !translate-x-0 !translate-y-0
          data-[state=open]:!translate-x-0
          data-[state=open]:!translate-y-0
          data-[state=open]:!max-w-none
          data-[state=open]:!max-h-none
        "
        style={{
          transform: "none",
          WebkitOverflowScrolling: "touch",
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <VisuallyHidden>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden>

        <div className="w-full max-w-5xl mx-auto p-6 space-y-6">
          <h1 className="text-3xl md:text-4xl font-semibold">{title}</h1>

          <pre className="
            w-full
            whitespace-pre-wrap
            text-2xl md:text-3xl lg:text-4xl
            leading-relaxed
            font-mono
          ">
            {content}
          </pre>

        </div>
      </DialogContent>
    </Dialog>
  );
}
