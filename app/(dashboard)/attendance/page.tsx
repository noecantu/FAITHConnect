"use client";

import { Suspense } from "react";
import AttendancePageContent from "./AttendancePageContent";

export const dynamic = "force-dynamic";

export default function AttendancePage() {
  return (
    <Suspense>
      <AttendancePageContent />
    </Suspense>
  );
}
