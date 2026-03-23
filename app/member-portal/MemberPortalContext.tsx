"use client";

import { createContext, useContext } from "react";

export type MemberPortalContextType = {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    groups?: string[];
    [key: string]: any; // allow extra fields without breaking
  };
  churchId: string;
};

export const MemberPortalContext = createContext<MemberPortalContextType | null>(null);

export function useMemberPortal() {
  const ctx = useContext(MemberPortalContext);
  if (!ctx) {
    throw new Error("useMemberPortal must be used inside MemberPortalContext.Provider");
  }
  return ctx;
}
