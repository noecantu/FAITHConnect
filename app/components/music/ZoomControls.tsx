"use client";

import { useZoom } from "./ZoomContext";
import { Plus, Minus, RotateCcw } from "lucide-react";

export function ZoomControls() {
  const { increase, decrease, reset } = useZoom();

  return (
    <div className="flex items-center gap-2 sm:gap-3 rounded-full border border-white/15 bg-black/30 px-2 py-1.5 backdrop-blur-sm">
      <button
        onClick={decrease}
        aria-label="Decrease text size"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <Minus className="h-4 w-4" />
      </button>

      <button
        onClick={reset}
        aria-label="Reset text size"
        className="flex h-10 min-w-[96px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <RotateCcw className="h-4 w-4" />
        <span className="hidden sm:inline">Reset</span>
      </button>

      <button
        onClick={increase}
        aria-label="Increase text size"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
