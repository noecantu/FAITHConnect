//app/(dashboard)/AttendancePageContent.tsx
"use client";

import { useSearchParams, useRouter, useParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
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
import { useCan } from "@/app/hooks/useCan";
import { useAuth } from "@/app/hooks/useAuth";
import { CalendarDays, QrCode, UserPlus, CheckCheck, UserX, Pencil, History, Users } from "lucide-react";
import { cn } from "@/app/lib/utils";

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
    // STATS
    const presentCount = useMemo(
      () => [...sortedMembers, ...sortedVisitors].filter((m) => records[m.id] === true).length,
      [sortedMembers, sortedVisitors, records]
    );
    const totalCount = sortedMembers.length + sortedVisitors.length;
    const absentCount = totalCount - presentCount;

    // QR GENERATOR
  async function handleGenerateQr() {
    try {
      setQrLoading(true);

      const today = new Date();
      const dateStr = today.toLocaleDateString("en-CA", { timeZone: "America/Denver" });
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL as string;
      const url = `${baseUrl}/check-in/${churchId}?d=${dateStr}`;
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
      toast({ title: "QR Generated", description: "The check‑in link has been copied to your clipboard." });
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

  function downloadQr() {
    const canvas = document.getElementById("qr-canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "attendance-qr.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  // MODE BADGE CONFIG
  const modeBadge =
    mode === "today"
      ? { label: "Today", classes: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" }
      : mode === "correction"
      ? { label: "Correcting", classes: "border-amber-500/40 bg-amber-500/15 text-amber-300" }
      : { label: "Past Date", classes: "border-white/20 bg-white/[0.07] text-white/50" };

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-black/60 backdrop-blur-xl p-8 text-center">
        <p className="text-white/40">Loading attendance…</p>
      </div>
    );
  }

  if (!authLoading && !canView) {
    return (
      <div className="rounded-2xl border border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-black/60 backdrop-blur-xl p-8 text-center">
        <p className="text-white/40">You do not have permission to view attendance.</p>
      </div>
    );
  }

  // MAIN RENDER
  return (
    <>
      {/* ── HERO CARD ── */}
      <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-black/90 via-black/75 to-black/60 backdrop-blur-xl shadow-2xl mb-6">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 60% 0%, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
        />
        <div className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", modeBadge.classes)}>
                  {modeBadge.label}
                </span>
                {mode === "correction" && (
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-400/80">
                    Correcting {format(date, "MMM d, yyyy")}
                  </span>
                )}
                {mode === "history" && (
                  <span className="rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-0.5 text-xs text-white/50">
                    Read‑Only Snapshot
                  </span>
                )}
                {totalCount > 0 && (
                  <>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-400">
                      {presentCount} Present
                    </span>
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-xs text-red-400/80">
                      {absentCount} Absent
                    </span>
                  </>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5">
                Attendance
              </h1>
              <div className="flex items-center gap-1.5 text-white/50 text-sm">
                <CalendarDays size={14} />
                <span>{format(date, "EEEE, MMMM d, yyyy")}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Input
                type="date"
                value={format(date, "yyyy-MM-dd")}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  const [year, month, day] = value.split("-").map(Number);
                  setDate(new Date(year, month - 1, day));
                  router.push(`${attendancePath}?date=${value}`);
                }}
                className="w-[150px] bg-black/60 text-white border border-white/20 rounded-lg px-3 py-2 text-center hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
              />
              <Button
                variant="ghost"
                onClick={() => {
                  const today = new Date();
                  setDate(today);
                  router.push(`${attendancePath}?date=${format(today, "yyyy-MM-dd")}`);
                }}
                className="bg-black/40 border border-white/15 hover:bg-white/10 text-white/70 hover:text-white"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push(`${attendancePath}/history`)}
                className="bg-black/40 border border-white/15 hover:bg-white/10 text-white/70 hover:text-white"
                title="View History"
              >
                <History size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK ACTIONS ── */}
      {mode !== "history" && (
        <div className="rounded-xl border border-white/15 bg-black/55 backdrop-blur-xl p-4 mb-6">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-white/30 mb-3">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => canEdit && handleGenerateQr()}
              disabled={!canEdit || qrLoading}
              className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-amber-950/30 hover:shadow-[0_4px_12px_rgba(251,191,36,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <QrCode size={20} className="text-amber-400" />
              <span className="text-xs text-white/60">{qrLoading ? "Generating…" : "Generate QR"}</span>
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  disabled={!canEdit}
                  className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-sky-400/40 hover:bg-sky-950/30 hover:shadow-[0_4px_12px_rgba(56,189,248,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserPlus size={20} className="text-sky-400" />
                  <span className="text-xs text-white/60">Add Visitor</span>
                </button>
              </DialogTrigger>
              <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
                <DialogHeader>
                  <DialogTitle>Add Visitor</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Visitor name"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && visitorName.trim()) {
                      const id = crypto.randomUUID();
                      setVisitors((prev) => [...prev, { id, name: visitorName.trim() }]);
                      setRecords((prev) => ({ ...prev, [id]: true }));
                      setVisitorName("");
                    }
                  }}
                  className="bg-black/80 text-white"
                  disabled={!canEdit}
                />
                <DialogFooter>
                  <Button
                    disabled={!canEdit}
                    onClick={() => {
                      if (!canEdit || !visitorName.trim()) return;
                      const id = crypto.randomUUID();
                      setVisitors((prev) => [...prev, { id, name: visitorName.trim() }]);
                      setRecords((prev) => ({ ...prev, [id]: true }));
                      setVisitorName("");
                    }}
                  >
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <button
              onClick={() => canEdit && markAllPresent(effectiveMembers, visitors)}
              disabled={!canEdit}
              className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-400/40 hover:bg-emerald-950/30 hover:shadow-[0_4px_12px_rgba(52,211,153,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CheckCheck size={20} className="text-emerald-400" />
              <span className="text-xs text-white/60">Mark All Present</span>
            </button>
            <button
              onClick={() => canEdit && markAllAbsent(effectiveMembers, visitors)}
              disabled={!canEdit}
              className="flex flex-col items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-center transition-all hover:-translate-y-0.5 hover:border-red-400/40 hover:bg-red-950/30 hover:shadow-[0_4px_12px_rgba(248,113,113,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <UserX size={20} className="text-red-400" />
              <span className="text-xs text-white/60">Mark All Absent</span>
            </button>
          </div>
        </div>
      )}

      {/* ── CORRECT THIS DATE ── */}
      {mode === "history" && canEdit && (
        <button
          onClick={() => router.push(`${attendancePath}?date=${selectedString}&correcting=true`)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 mb-6 text-sm font-medium text-amber-300 transition-all hover:bg-amber-500/15 hover:border-amber-500/40"
        >
          <Pencil size={14} />
          Edit Attendance for {format(date, "MMMM d, yyyy")}
        </button>
      )}

      {/* ── MEMBERS & VISITORS ── */}
      <div className="rounded-xl border border-white/15 bg-black/55 backdrop-blur-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-white/40" />
            <span className="text-sm font-semibold text-white/70 tracking-wide">Members &amp; Visitors</span>
          </div>
          {totalCount > 0 && (
            <span className="text-xs text-white/35">{totalCount} total</span>
          )}
        </div>
        <div className="p-4">
          <AttendanceGrid
            members={sortedMembers}
            visitors={sortedVisitors}
            records={records}
            mode={mode}
            canEdit={canEdit}
            onToggle={(id) => {
              if (!canEdit) return;
              setRecords((prev) => ({ ...prev, [id]: !prev[id] }));
            }}
            onRemoveVisitor={(id) => {
              if (!canEdit) return;
              setVisitors((prev) => prev.filter((v) => v.id !== id));
            }}
          />
        </div>
      </div>

      {/* ── SAVE FAB ── */}
      {mode !== "history" && (
        <Fab
          disabled={!canEdit}
          onClick={async () => {
            if (!canEdit) return;
            try {
              await save();
              if (mode === "correction") {
                router.push(`${attendancePath}?date=${selectedString}`);
              }
              toast({ title: "Attendance Saved" });
            } catch {
              toast({
                title: "Unable to save attendance",
                description: "Please try again. If the problem continues, check the browser console for details.",
                variant: "destructive",
              });
            }
          }}
          type="save"
        />
      )}

      {/* ── QR MODAL ── */}
      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="bg-white/10 backdrop-blur-sm border border-white/20">
          <DialogHeader>
            <DialogTitle>Attendance QR Code</DialogTitle>
            <DialogDescription>Scan or share this code to check in.</DialogDescription>
          </DialogHeader>
          {qrUrl && (
            <div className="flex flex-col items-center gap-4 py-4">
              <QRCodeCanvas value={qrUrl} size={200} id="qr-canvas" />
              <Button onClick={downloadQr} className="w-full">Download QR</Button>
              <div className="text-xs text-white/60 break-all text-center">{qrUrl}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
