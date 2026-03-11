"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import Flatpickr from "react-flatpickr";

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
import { useUserRoles } from "@/app/hooks/useUserRoles";
import { useMembers } from "@/app/hooks/useMembers";
import { useAttendance } from "@/app/hooks/useAttendance";
import { useToast } from "@/app/hooks/use-toast";

import { QRCodeCanvas } from "qrcode.react";
import { AttendanceGrid } from "@/app/components/attendance/AttendanceGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function AttendancePageContent() {
  const searchParams = useSearchParams();
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
  const [visitorName, setVisitorName] = useState("");
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

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

  // ROLES
  const { isAdmin, isAttendanceManager, loading: rolesLoading } =
    useUserRoles(churchId);

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

  const loading = rolesLoading || membersLoading || attendanceLoading;

  // EFFECTIVE MEMBERS (LIVE or SNAPSHOT)
  const effectiveMembers =
    mode === "history" || mode === "correction"
      ? membersSnapshot || []
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
      <div className="p-6">
        <PageHeader title="Attendance" subtitle={dateString} />
        <p className="text-muted-foreground">Loading Attendance…</p>
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
        <Flatpickr
          defaultValue={format(date, "MM-dd-yyyy")}
          options={{
            dateFormat: "m-d-Y",
            allowInput: false,
            altInput: true,
            altFormat: "m-d-Y",
            monthSelectorType: "dropdown",
            closeOnSelect: true,
          }}
          onChange={([selected]) => {
            if (!selected) return;
            setDate(selected);
            router.push(`/attendance?date=${format(selected, "yyyy-MM-dd")}`);
          }}
          className="w-full sm:w-[150px] bg-black/40 text-white border-white/20 rounded-md px-3 py-2 text-center"
        />

        <Button
          variant="outline"
          onClick={() => {
            const today = new Date();
            setDate(today);
            router.push(`/attendance?date=${format(today, "yyyy-MM-dd")}`);
          }}
          className="text-white/80 border-white/20"
        >
          Today
        </Button>

        <Button
          onClick={() => router.push("/attendance/history")}
          className="text-white/80 border-white/20"
        >
          History
        </Button>
      </div>

      {/* ACTION BUTTONS */}
      {mode !== "history" && (
        <Card className="border border-white/10 bg-white/5 backdrop-blur-sm mb-4">
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
            <Button
              onClick={handleGenerateQr}
              variant="default"
              disabled={qrLoading}
              className="w-full flex flex-col items-center justify-center text-center 
                bg-yellow-700/80 hover:bg-yellow-900/80 active:bg-yellow-950/80
                gap-1 transition-colors"
            >
              <span className="text-sm text-white/80">
                {qrLoading ? "Generating..." : "Generate QR"}
              </span>
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  className="w-full flex flex-col items-center justify-center text-center 
                    bg-cyan-700/80 hover:bg-cyan-900/80 active:bg-cyan-950/80
                    gap-1 transition-colors"
                >
                  <span className="text-sm text-white/80">Add Visitor</span>
                </Button>
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

            <Button
              onClick={() => markAllPresent(effectiveMembers, visitors)}
              variant="default"
              className="w-full flex flex-col items-center justify-center text-center 
                bg-green-700/80 hover:bg-green-900/80 active:bg-green-950/80
                gap-1 transition-colors"
            >
              <span className="text-sm text-white/80">Mark All Present</span>
            </Button>

            <Button
              onClick={() => markAllAbsent(effectiveMembers, visitors)}
              variant="default"
              className="w-full flex flex-col items-center justify-center text-center
                bg-red-700/80 hover:bg-red-900/80 active:bg-red-950/80
                gap-1 transition-colors"
            >
              <span className="text-sm text-white/80">Mark All Absent</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CORRECT THIS DATE BUTTON */}
      {mode === "history" && (
        <Button
          onClick={() =>
            router.push(`/attendance?date=${selectedString}&correcting=true`)
          }
          className="w-full bg-blue-700/60 hover:bg-blue-800/60 text-white/80"
        >
          Edit Attendance for This Date
        </Button>
      )}

      {/* LINE SEPARATOR */}
      <div className="w-full h-px bg-white/20 shadow-[0_0_4px_rgba(255,255,255,0.1)]" />

      {/* TEXT-ONLY CARDS */}
      <AttendanceGrid
        members={sortedMembers}
        visitors={sortedVisitors}
        records={records}
        mode={mode}
        onToggle={(id) =>
          setRecords((prev) => ({
            ...prev,
            [id]: !prev[id],
          }))
        }
        onRemoveVisitor={(id) =>
          setVisitors((prev) => prev.filter((v) => v.id !== id))
        }
      />

      {/* SAVE BUTTON */}
      {mode !== "history" && (
        <Fab
          onClick={async () => {
            await save();

            if (mode === "correction") {
              router.push(`/attendance?date=${selectedString}`);
            }

            toast({ title: "Attendance saved" });
          }}
          type="save"
        />
      )}

      {/* QR MODAL */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/10">
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
