"use client";

import { createContext, useContext, useState } from "react";

export interface ZoomContextValue {
  zoom: number;
  increase: () => void;
  decrease: () => void;
  reset: () => void;
}

const ZoomContext = createContext<ZoomContextValue | null>(null);

export function ZoomProvider({ children }: { children: React.ReactNode }) {
  const [zoom, setZoom] = useState(1);

  const increase = () => setZoom(z => Math.min(2.5, z + 0.1));
  const decrease = () => setZoom(z => Math.max(0.6, z - 0.1));
  const reset = () => setZoom(1);

  return (
    <ZoomContext.Provider value={{ zoom, increase, decrease, reset }}>
      {children}
    </ZoomContext.Provider>
  );
}

export const useZoom = (): ZoomContextValue => {
  const ctx = useContext(ZoomContext);
  if (!ctx) throw new Error("useZoom must be used inside a ZoomProvider");
  return ctx;
};
