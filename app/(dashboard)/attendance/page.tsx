//app/(dashboard)/attendance/page.tsx
"use client";

import AttendancePageContent from "./AttendancePageContent";

export const dynamic = "force-dynamic";

export default function AttendancePage() {
  return (
    <>
      <AttendancePageContent />
    </>
  );
}
