//app/components/music/FullscreenModal.tsx
"use client";

import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Expand, FileText, Music2, X } from "lucide-react";

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
  const isLyrics = / — Lyrics$/i.test(title);
  const contentLabel = isLyrics ? "Lyrics" : "Chords";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <ZoomProvider>
        <DialogContent
          aria-describedby={undefined}
          className="
            fixed inset-0 z-50
            p-0 m-0
            overflow-hidden
            bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.98),rgba(0,0,0,0.94))] text-white
            border-none shadow-none
            !max-w-none !max-h-none
            !translate-x-0 !translate-y-0
          "
          style={{ transform: "none" }}
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
              px-3 md:px-6
            "
            style={{
              paddingTop: "max(env(safe-area-inset-top), 80px)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_28%)]" />

            {/* HEADER */}
            <div
              className="
                relative
                z-40
                mx-auto w-full max-w-5xl
                rounded-2xl border border-white/15
                bg-black/65
                px-4 py-4 md:px-6
                backdrop-blur-xl
                shadow-[0_12px_30px_rgba(0,0,0,0.28)]
                flex items-start justify-between gap-3 md:gap-4
              "
            >
              <div className="min-w-0 flex-1 space-y-2 pr-1">
                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/55">
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                    {isLyrics ? (
                      <FileText className="h-3.5 w-3.5 text-blue-500/80" />
                    ) : (
                      <Music2 className="h-3.5 w-3.5 text-emerald-500/90" />
                    )}
                    {contentLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1">
                    <Expand className="h-3.5 w-3.5 text-white/60" />
                    Fullscreen
                  </span>
                </div>
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl md:text-3xl break-words">
                  {cleanTitle}
                </h1>
              </div>

              <button
                onClick={() => onClose(false)}
                aria-label="Close fullscreen view"
                className="
                  shrink-0
                  flex h-11 w-11 items-center justify-center
                  rounded-full
                  border border-white/15
                  bg-white/10
                  text-white/80
                  backdrop-blur
                  transition-colors
                  hover:bg-white/15 hover:text-white
                "
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* SCROLL AREA */}
            <div className="relative flex-1 overflow-y-auto px-1 py-4 md:px-2 md:py-5">
              <div className="mx-auto max-w-5xl rounded-[28px] border border-white/10 bg-black/45 px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm md:px-8 md:py-8">
                <ZoomableText>{content}</ZoomableText>
              </div>
            </div>

            {/* FOOTER */}
            <div
              className="
                relative
                z-40
                mx-auto w-full max-w-5xl
                rounded-2xl border border-white/15
                bg-black/65
                px-4 py-4 md:px-6
                backdrop-blur-xl
                shadow-[0_12px_30px_rgba(0,0,0,0.24)]
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
