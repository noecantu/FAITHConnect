'use client';

import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { PageHeader } from '@/app/components/page-header';
import { Card } from '@/app/components/ui/card';
import { useChurchId } from '@/app/hooks/useChurchId';
import { useUserRoles } from '@/app/hooks/useUserRoles';
import { useMembers } from '@/app/hooks/useMembers';
import { useAttendance } from '@/app/hooks/useAttendance';
import Image from "next/image";
import { Fab } from '@/app/components/ui/fab';
import { AttendanceControls } from '@/app/components/attendance/AttendanceControls';
import { useRouter } from 'next/navigation';
import { useToast } from "@/app/hooks/use-toast";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/app/components/ui/dialog";

import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { X } from "lucide-react";

export default function AttendancePage() {
  const churchId = useChurchId();
  const router = useRouter();
  const { toast } = useToast();

  const [date, setDate] = useState(new Date());
  const dateString = format(date, "yyyy-MM-dd");

  const {
    isAdmin,
    isAttendanceManager,
    loading: rolesLoading,
  } = useUserRoles(churchId);

  const { members, loading: membersLoading } = useMembers(churchId);

  const {
    records,
    setRecords,
    visitors,
    setVisitors,
    toggle,
    save,
    loading: attendanceLoading,
  } = useAttendance(churchId, dateString);

  const [visitorName, setVisitorName] = useState("");

  const loading = rolesLoading || membersLoading || attendanceLoading;

  // Memoized active members to prevent infinite loops
  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "Archived"),
    [members]
  );

  // Ensure every member/visitor has an explicit record
  useEffect(() => {
    const allIds = [
      ...activeMembers.map((m) => m.id),
      ...visitors.map((v) => v.id),
    ];

    setRecords((prev) => {
      const next = { ...prev };
      allIds.forEach((id) => {
        if (next[id] === undefined) {
          next[id] = true;
        }
      });
      return next;
    });
  }, [activeMembers, visitors, setRecords]);

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

      {/* Page Header */}
      <PageHeader title="Attendance" subtitle={dateString} />

      {/* Attendance Controls — matches CalendarControls layout */}
      <AttendanceControls
        date={date}
        setDate={setDate}
        onHistory={() => router.push("/attendance/history")}
      />

      {/* Add Visitor Card */}
      <Dialog>
        <DialogTrigger asChild>
          <Card className="p-4 flex flex-col items-center justify-center text-center gap-2 cursor-pointer border border-dashed border-white/20 hover:bg-white/5 transition">
            <span className="text-3xl text-white/70">+</span>
            <span className="text-sm text-white/80">Add Visitor</span>
          </Card>
        </DialogTrigger>

        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
          <DialogHeader>
            <DialogTitle>Add Visitor</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Visitor name"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="bg-black/40 text-white"
          />

          <DialogFooter>
            <Button
              onClick={() => {
                if (!visitorName.trim()) return;

                const id = `visitor-${Date.now()}`;
                setVisitors((prev) => [...prev, { id, name: visitorName.trim() }]);
                setVisitorName("");
              }}
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Members + Visitors Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {[...activeMembers, ...visitors].map((m) => {
          const isVisitor = !("firstName" in m);
          const id = m.id;

          const name = isVisitor
            ? m.name
            : `${m.firstName} ${m.lastName}`;

          const photo =
            !isVisitor && m.profilePhotoUrl
              ? m.profilePhotoUrl
              : null;

          const initials = isVisitor
            ? m.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
            : null;

          const present = records[id] === true;

          return (
            <Card
              key={id}
              className="relative group p-4 flex flex-col items-center text-center gap-2 cursor-pointer"
              onClick={() => toggle(id)}
            >
              {isVisitor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisitors((prev) => prev.filter((v) => v.id !== id));
                  }}
                  className="
                    absolute top-2 right-2
                    h-5 w-5 flex items-center justify-center
                    rounded-full bg-black/40 border border-white/10
                    text-white/60 hover:text-white hover:bg-black/60
                    opacity-0 group-hover:opacity-100 transition
                  "
                >
                  <X className="h-3 w-3" />
                </button>
              )}

              <div className="w-16 h-16 relative flex items-center justify-center rounded-md border border-slate-300 bg-slate-700/40 overflow-hidden">
                {photo ? (
                  <Image
                    src={photo}
                    alt={name}
                    fill
                    className="object-cover rounded-md"
                  />
                ) : (
                  <span className="text-white/70 text-xs font-medium tracking-wide">
                    {isVisitor ? "Visitor" : initials}
                  </span>
                )}
              </div>

              <span className="font-medium leading-tight truncate w-full">
                {name}
              </span>

              <span
                className={
                  present
                    ? "text-green-600 font-semibold text-sm"
                    : "text-red-600 font-semibold text-sm"
                }
              >
                {present ? "Present" : "Absent"}
              </span>
            </Card>
          );
        })}
      </div>

      {isAttendanceManager && (
        <Fab
          type="save"
          onClick={async () => {
            await save();
            toast({
              title: "Attendance Saved",
              description: `${dateString} has been updated.`,
            });
          }}
        />
      )}
    </div>
  );
}