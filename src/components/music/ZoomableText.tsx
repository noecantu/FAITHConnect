"use client";

import { useZoom } from "./ZoomContext";

export function ZoomableText({ children }) {
  const { zoom } = useZoom();

  return (
    <pre
      className="
        w-full
        whitespace-pre-wrap
        font-mono
        leading-relaxed
      "
      style={{
        fontSize: `${zoom * 1.5}rem`,
        lineHeight: `${zoom * 1.8}rem`,
        transition: "font-size 120ms ease, line-height 120ms ease",
      }}
    >
      {children}
    </pre>
  );
}
