//app/(dashboard)/AttendancePageContent.tsx
"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/app/components/page-header";
import { Fab } from "@/app/components/ui/fab";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { useChurchId } from "@/app/hooks/useChurchId";
import { useMembers } from "@/app/hooks/useMembers";
import { useAttendance } from "@/app/hooks/useAttendance";
import { useToast } from "@/app/hooks/use-toast";
import { QRCodeCanvas } from "qrcode.react";
import { AttendanceGrid } from "@/app/components/attendance/AttendanceGrid";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";
import { useCan } from "@/app/hooks/useCan";import { useAuth } from '@/app/hooks/useAuth';import { Separator } from "@/app/components/ui/separator";

export default function AttendancePageContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const routeSlug = String(params?.slug ?? "");
  const urlDate = searchParams.get("date");

  function parseLocalDate(dateString: string): Date {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const initialDate = urlDate ? parseLocalDate(urlDate) : new Date();
  const [date, setDate] = useState(initialDate);
  const dateString = format(date, "yyyy-MM-dd");

  const router = useRouter();
  const { toast } = useToast();
  const { churchId } = useChurchId();
  const attendancePath = routeSlug ? `/church/${routeSlug}/attendance` : "/attendance";

  const [visitorName, setVisitorName] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  // PERMISSIONS
  const { loading: authLoading } = useAuth();
  const canView = useCan("attendance.read");
  const canEdit = useCan("attendance.manage");

  // MODE LOGIC
  const correcting = searchParams.get("correcting") === "true";
  const todayString = format(new Date(), "yyyy-MM-dd");
  const selectedString = format(date, "yyyy-MM-dd");
  const isToday = selectedString === todayString;

  const mode = correcting
    ? "correction"
    : isToday
    ? "today"
    : "history";

  // MEMBERS (LIVE)
  const { members, loading: membersLoading } = useMembers();
  const effectiveEditable = isToday || correcting;

  // ATTENDANCE (SNAPSHOT + RECORDS)
  const {
    records,
    setRecords,
    visitors,
    setVisitors,
    save,
    loading: attendanceLoading,
    markAllPresent,
    markAllAbsent,
    membersSnapshot,
  } = useAttendance(churchId, members, dateString, effectiveEditable);

  const loading = membersLoading || attendanceLoading;

  // EFFECTIVE MEMBERS (LIVE or SNAPSHOT)
  // For past dates, prefer the snapshot (who was a member then) but fall back
  // to live members when there is no saved attendance yet for that date.
  const effectiveMembers =
    mode === "history" || mode === "correction"
      ? (membersSnapshot && membersSnapshot.length > 0 ? membersSnapshot : members)
      : members;

  // SORT MEMBERS
  const activeMembers = useMemo(
    () => effectiveMembers.filter((m) => m.status !== "Archived"),
    [effectiveMembers]
  );

  const sortedMembers = useMemo(() => {
    return [...activeMembers].sort((a, b) => {
      const lastA = a.lastName.toLowerCase();
      const lastB = b.lastName.toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      return a.firstName.toLowerCase().localeCompare(b.firstName.toLowerCase());
    });
  }, [activeMembers]);

  const sortedVisitors = useMemo(() => {
    return [...visitors].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  }, [visitors]);

  // QR GENERATOR
  async function handleGenerateQr() {
    try {
      setQrLoading(true);

      const today = new Date();
      const dateString = today.toLocaleDateString("en-CA", {
        timeZone: "America/Denver",
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL as string;
      const url = `${baseUrl}/check-in/${churchId}?d=${dateString}`;

      setQrUrl(url);
      setQrOpen(true);

      try {
        await navigator.clipboard.writeText(url);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      toast({
        title: "QR Generated",
        description: "The check‑in link has been copied to your clipboard.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Something went wrong.",
      });
    } finally {
      setQrLoading(false);
    }
  }

  // Sync date when URL changes
  useEffect(() => {
    if (urlDate) {
      setDate(parseLocalDate(urlDate));
    }
  }, [urlDate]);

  // LOADING / PERMISSION STATES
  if (loading) {
    return (
      <>
        <PageHeader title="Attendance" subtitle={dateString} />
        <p className="text-muted-foreground">Loading Attendance…</p>
      </>
    );
  }

  if (!authLoading && !canView) {
    return (
      <>
        <PageHeader title="Attendance" subtitle={dateString} />
        <p className="text-muted-foreground">
          You do not have permission to view attendance.
        </p>
      </>
    );
  }

  function downloadQr() {
    const canvas = document.getElementById(
      "qr-canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = "attendance-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // MAIN RENDER
  return (
    <>
      <PageHeader title="Attendance" subtitle={dateString} />

      {/* MODE LABEL */}
      {mode === "history" && (
        <div className="text-white/60 text-xs mb-2">
          Snapshot from {format(date, "MMMM d, yyyy")} — Read‑Only
        </div>
      )}

      {mode === "correction" && (
        <div className="text-white/60 text-xs mb-2">
          Correcting Attendance for {format(date, "MMMM d, yyyy")}
        </div>
      )}

      {/* DATE PICKER + TODAY + HISTORY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mb-4">
        <Input
          type="date"
          value={format(date, "yyyy-MM-dd")}
          onChange={(e) => {
            const value = e.target.value
            if (!value) return

            // Avoid timezone shift — construct local date
            const [year, month, day] = value.split("-").map(Number)
            const newDate = new Date(year, month - 1, day)

            setDate(newDate)
            router.push(`${attendancePath}?date=${value}`)
          }}
          className="
            w-full sm:w-[150px]
            bg-black/80 text-white
            border border-white/20
            rounded-md px-3 py-2 text-center
            hover:border-white/50
            focus:outline-none focus:ring-2 focus:ring-white/40
            cursor-pointer
          "
        />
        <Button
          variant="ghost"
          onClick={() => {
            const today = new Date();
            setDate(today);
            router.push(`${attendancePath}?date=${format(today, "yyyy-MM-dd")}`);
          }}
          className="w-full sm:w-auto bg-black/80 border border-white/20 backdrop-blur-xl"
        >
          Today
        </Button>
      </div>

      {/* ACTION BUTTONS */}
      {mode !== "history" && (
        <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl">
          <CardHeader className="pb-2">
            <h1 className="text-sm font-medium text-white/70 tracking-wide">
              Quick Actions
            </h1>
          </CardHeader>
          <Separator/>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">

            {/* GENERATE QR */}
            <Button
              onClick={() => canEdit && handleGenerateQr()}
              variant="default"
              disabled={!canEdit || qrLoading}
              className="w-full flex flex-col items-center justify-center text-center 
                bg-gradient-to-b from-yellow-500/70 to-yellow-600/70
                gap-1 transition-colors"
            >
              <span className="text-sm text-white/80">
                {qrLoading ? "Generating..." : "Generate QR"}
              </span>
            </Button>

            {/* ADD VISITOR */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  disabled={!canEdit}
                  className="w-full flex flex-col items-center justify-center text-center 
                    bg-gradient-to-b from-cyan-500/70 to-cyan-600/70
                    hover:from-cyan-500/90 hover:to-cyan-600/90
                    active:scale-[0.97]
                    gap-1 transition-colors"
                >
                  <span className="text-sm text-white/80">Add Visitor</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
                <DialogHeader>
                  <DialogTitle>Add Visitor</DialogTitle>
                </DialogHeader>

                <Input
                  placeholder="Visitor name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  className="bg-black/80 text-white"
                  disabled={!canEdit}
                />

                <DialogFooter>
                  <Button
                    disabled={!canEdit}
                    onClick={() => {
                      if (!canEdit) return;
                      if (!visitorName.trim()) return;

                      const id = `visitor-${Date.now()}`;

                      setVisitors((prev) => [
                        ...prev,
                        { id, name: visitorName.trim() },
                      ]);

                      setRecords((prev) => ({
                        ...prev,
                        [id]: true,
                      }));

                      setVisitorName("");
                    }}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* MARK ALL PRESENT */}
            <Button
              onClick={() => canEdit && markAllPresent(effectiveMembers, visitors)}
              variant="default"
              disabled={!canEdit}
              className="w-full flex flex-col items-center justify-center text-center 
                bg-gradient-to-b from-green-500/70 to-green-700/70
                gap-1 transition-colors"
            >
              <span className="text-sm text-white/80">Mark All Present</span>
            </Button>

            {/* MARK ALL ABSENT */}
            <Button
              onClick={() => canEdit && markAllAbsent(effectiveMembers, visitors)}
              variant="default"
              disabled={!canEdit}
              className="w-full flex flex-col items-center justify-center text-center
                bg-gradient-to-b from-red-500/70 to-red-700/70
                hover:from-red-500/90 hover:to-red-700/90
                active:scale-[0.97]
                gap-1 transition-colors"
            >
              <span className="text-sm text-white/80">Mark All Absent</span>
            </Button>

          </CardContent>
        </Card>
      )}

      {/* CORRECT THIS DATE BUTTON */}
      {mode === "history" && canEdit && (
        <Button
          onClick={() =>
            router.push(`${attendancePath}?date=${selectedString}&correcting=true`)
          }
          className="w-full bg-blue-700/60 hover:bg-blue-800/60 text-white/80"
        >
          Edit Attendance for This Date
        </Button>
      )}

      {/* MEMBER SECTION */}
      <Card className="relative bg-black/80 border-white/20 backdrop-blur-xl mt-8">
        <CardHeader className="pb-2">
          <h1 className="text-sm font-medium text-white/70 tracking-wide">
            Members
          </h1>
        </CardHeader>

        <Separator />

        <CardContent className="p-4">
          <AttendanceGrid
            members={sortedMembers}
            visitors={sortedVisitors}
            records={records}
            mode={mode}
            canEdit={canEdit}
            onToggle={(id) => {
              if (!canEdit) return;
              setRecords((prev) => ({
                ...prev,
                [id]: !prev[id],
              }));
            }}
            onRemoveVisitor={(id) => {
              if (!canEdit) return;
              setVisitors((prev) => prev.filter((v) => v.id !== id));
            }}
          />
        </CardContent>
      </Card>

      {/* SAVE BUTTON */}
      {mode !== "history" && (
        <Fab
          disabled={!canEdit}
          onClick={async () => {
            if (!canEdit) return;

            await save();

            if (mode === "correction") {
              router.push(`${attendancePath}?date=${selectedString}`);
            }

            toast({ title: "Attendance Saved" });
          }}
          type="save"
        />
      )}

      {/* QR MODAL */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
          <DialogHeader>
            <DialogTitle>Attendance QR Code</DialogTitle>
            <DialogDescription>
              Scan or share this code to check in.
            </DialogDescription>
          </DialogHeader>

          {qrUrl && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeCanvas value={qrUrl} size={200} id="qr-canvas" />

              <Button onClick={downloadQr} className="w-full">
                Download QR
              </Button>

              <div className="text-xs text-white/60 break-all text-center">
                {qrUrl}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
