"use client";

import { useZoom } from "./ZoomContext";
import { Plus, Minus, RotateCcw } from "lucide-react";

export function ZoomControls() {
  const { increase, decrease, reset } = useZoom();

  return (
    <div className="flex gap-4 items-center">
      <button onClick={decrease} className="p-2 rounded bg-white/10">
        <Minus />
      </button>

      <button onClick={reset} className="p-2 rounded bg-white/10">
        <RotateCcw />
      </button>

      <button onClick={increase} className="p-2 rounded bg-white/10">
        <Plus />
      </button>
    </div>
  );
}
