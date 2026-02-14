'use client';

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/app/components/page-header";
import { Card } from "@/app/components/ui/card";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useUserRoles } from "@/app/hooks/useUserRoles";
import { useMembers } from "@/app/hooks/useMembers";
import { useAttendance } from "@/app/hooks/useAttendance";
import Image from "next/image";
import { Fab } from "@/app/components/ui/fab";
import { AttendanceControls } from "@/app/components/attendance/AttendanceControls";
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
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

import { useSettings } from "@/app/hooks/use-settings";
import { useAuth } from "@/app/hooks/useAuth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

export default function AttendancePageContent() {
  const searchParams = useSearchParams();
  const urlDate = searchParams.get("date");

  function parseLocalDate(dateString: string) {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const initialDate = urlDate ? parseLocalDate(urlDate) : new Date();
  const [date, setDate] = useState(initialDate);
  const dateString = format(date, "yyyy-MM-dd");

  const churchId = useChurchId();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // SETTINGS
  const { settings } = useSettings();
  const savedAttendanceView = settings?.attendanceView ?? "cards";
  const [attendanceView, setAttendanceView] = useState<"cards" | "list">("cards");

  useEffect(() => {
    if (savedAttendanceView && savedAttendanceView !== attendanceView) {
      setAttendanceView(savedAttendanceView);
    }
  }, [attendanceView, savedAttendanceView]);

  // ROLES
  const {
    isAdmin,
    isAttendanceManager,
    loading: rolesLoading,
  } = useUserRoles(churchId);

  // MEMBERS
  const { members, loading: membersLoading } = useMembers(churchId);

  // ATTENDANCE
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

  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "Archived"),
    [members]
  );

  // Ensure every member/visitor has a record
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

  // Sync date when URL changes
  useEffect(() => {
    if (urlDate) {
      setDate(parseLocalDate(urlDate));
    }
  }, [urlDate]);

  // LOADING / PERMISSION STATES
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

  // MAIN RENDER
  return (
    <div className="p-6 space-y-6">

      {/* PAGE HEADER */}
      <PageHeader title="Attendance" subtitle={dateString}>
        <div className="flex items-center gap-4">
          <RadioGroup
            value={attendanceView}
            onValueChange={async (v: "cards" | "list") => {
              setAttendanceView(v);

              if (user?.id) {
                await updateDoc(doc(db, "users", user.id), {
                  "settings.attendanceView": v,
                  updatedAt: serverTimestamp(),
                });
              }
            }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="cards" id="view-cards" />
              <label htmlFor="view-cards" className="text-sm">Cards</label>
            </div>

            <div className="flex items-center gap-1">
              <RadioGroupItem value="list" id="view-list" />
              <label htmlFor="view-list" className="text-sm">List</label>
            </div>
          </RadioGroup>
        </div>
      </PageHeader>

      {/* DATE CONTROLS */}
      <AttendanceControls
        date={date}
        setDate={setDate}
        onHistory={() => router.push("/attendance/history")}
      />

      {/* ADD VISITOR */}
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

      {/* CARDS VIEW */}
      {attendanceView === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {/* grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-8 gap-6 */}
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
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <span className="text-white/70 text-xs font-medium tracking-wide">
                      {isVisitor ? "Visitor" : initials}
                    </span>
                  )}
                </div>

                <span
                  className="
                    font-medium leading-tight
                    line-clamp-2
                    text-center
                    w-full
                    max-w-[80px]
                    h-[2.5rem]
                  "
                >
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
      )}

      {/* LIST VIEW */}
      {attendanceView === "list" && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[...activeMembers, ...visitors].map((m) => {
            const isVisitor = !("firstName" in m);
            const id = m.id;

            const name = isVisitor
              ? m.name
              : `${m.firstName} ${m.lastName}`;

            const present = records[id] === true;

            return (
              <div
                key={id}
                className="flex items-center justify-between p-3 rounded-md border border-white/10 bg-white/5 cursor-pointer"
                onClick={() => toggle(id)}
              >
                <span className="font-medium">{name}</span>
                <span className={present ? "text-green-500" : "text-red-500"}>
                  {present ? "Present" : "Absent"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* SAVE BUTTON */}
      <Fab
        onClick={async () => {
          await save();
          toast({ title: "Attendance saved" });
        } } type={"save"}      />
    </div>
  );
}
