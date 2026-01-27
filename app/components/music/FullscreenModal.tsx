"use client";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";

import { ZoomProvider } from "./ZoomContext";
import { ZoomControls } from "./ZoomControls";
import { ZoomableText } from "./ZoomableText";

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
  const cleanTitle = title
    .replace(/ — Chords$/i, "")
    .replace(/ — Lyrics$/i, "");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <ZoomProvider>
        <DialogContent
          aria-describedby={undefined}
          className="
            fixed inset-0
            p-0 m-0
            bg-black text-white
            border-none shadow-none
            !max-w-none !max-h-none
            !translate-x-0 !translate-y-0
          "
          style={{
            transform: "none",
          }}
        >
          <VisuallyHidden>
            <DialogTitle>{cleanTitle}</DialogTitle>
          </VisuallyHidden>

          {/* FULLSCREEN SHELL */}
          <div
            className="
              relative
              w-full h-full
              flex flex-col
              overflow-hidden
            "
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* HEADER */}
            <div
              className="
                sticky top-0
                z-40
                bg-black
                px-6 py-4
                border-b border-white/10
                flex justify-between items-center
              "
            >
              <h1 className="text-3xl font-semibold">{cleanTitle}</h1>

              <button
                onClick={() => onClose(false)}
                className="
                  p-2
                  rounded-full
                  bg-white/10
                  backdrop-blur
                "
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* SCROLL AREA */}
            <div
              className="
                flex-1
                overflow-y-auto
                px-6 py-6
              "
            >
              <ZoomableText>{content}</ZoomableText>
            </div>

            {/* FOOTER (STICKY) */}
            <div
              className="
                sticky bottom-0
                z-40
                bg-black
                px-6 py-4
                border-t border-white/10
                flex justify-center
              "
            >
              <ZoomControls />
            </div>
          </div>
        </DialogContent>
      </ZoomProvider>
    </Dialog>
  );
}
