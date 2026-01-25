"use client";

import { useZoom } from "./ZoomContext";

interface ZoomableTextProps {
  children: string;
}

export function ZoomableText({ children }: ZoomableTextProps) {
  const { zoom } = useZoom();
  const text = children?.trim();

  if (!text) {
    return (
      <div
        className="
          w-full
          py-20
          text-center
          text-white/40 italic
          text-2xl
        "
        style={{ fontSize: `${zoom}px` }}
      >
        No Content Provided
      </div>
    );
  }

  return (
    <pre
      className="
        whitespace-pre-wrap
        font-mono
        leading-relaxed
        text-white
      "
      style={{ fontSize: `${zoom}px` }}
    >
      {text}
    </pre>
  );
}
