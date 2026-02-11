'use client';

import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useAttendance } from '@/app/hooks/useAttendance';
import { getTodayDateString } from '@/app/lib/utils/dates';

export default function AttendancePage() {
  const churchId = useChurchId();
  const dateString = getTodayDateString();

  const {
    isAdmin,
    isAttendanceManager,
    loading: rolesLoading,
  } = useUserRoles(churchId);

  const {
    members,
    records,
    toggle,
    loading: attendanceLoading,
  } = useAttendance(churchId, dateString);

  const loading = rolesLoading || attendanceLoading;

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Attendance" subtitle={dateString} />
        <p className="text-muted-foreground">Loading attendance…</p>
      </div>
    );
  }

  if (!isAdmin && !isAttendanceManager) {
    return (
      <div className="p-6">
        <PageHeader title="Attendance" subtitle={dateString} />
        <p className="text-muted-foreground">
          You do not have permission to manage attendance.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Attendance" subtitle={dateString} />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {members.map((m) => {
            const present = records[m.id] !== false;

            return (
            <Card
                key={m.id}
                className="p-4 flex flex-col items-center justify-center text-center cursor-pointer"
                onClick={() => toggle(m.id)}
            >
                <span className="font-medium">
                {m.firstName} {m.lastName}
                </span>

                <span
                className={
                    present
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
                >
                {present ? "Present" : "Absent"}
                </span>
            </Card>
            );
        })}
    </div>

    </div>
  );
}
