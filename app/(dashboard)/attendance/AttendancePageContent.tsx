"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import Flatpickr from "react-flatpickr";

import { PageHeader } from "@/app/components/page-header";
import { Card } from "@/app/components/ui/card";
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
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

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

  // ROLES
  const { isAdmin, isAttendanceManager, loading: rolesLoading } =
    useUserRoles(churchId);

  // MEMBERS
  const { members, loading: membersLoading } = useMembers();

  // ATTENDANCE
  const {
    records,
    visitors,
    setVisitors,
    toggle,
    save,
    loading: attendanceLoading,
    markAllPresent,
    markAllAbsent,
  } = useAttendance(churchId, members, dateString);

  const loading = rolesLoading || membersLoading || attendanceLoading;

  // SORT MEMBERS
  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "Archived"),
    [members]
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
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

                  toggle(id);
                  setVisitorName("");
                }}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => markAllPresent(members, visitors)}
          variant="default"
          className="w-full flex flex-col items-center justify-center text-center 
            bg-green-700/80 hover:bg-green-900/80 active:bg-green-950/80
            gap-1 transition-colors"
        >
          <span className="text-sm text-white/80">Mark All Present</span>
        </Button>

        <Button
          onClick={() => markAllAbsent(members, visitors)}
          variant="default"
          className="w-full flex flex-col items-center justify-center text-center
            bg-red-700/80 hover:bg-red-900/80 active:bg-red-950/80
            gap-1 transition-colors"
        >
          <span className="text-sm text-white/80">Mark All Absent</span>
        </Button>
      </div>

      {/* TEXT-ONLY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
        {[...sortedMembers, ...sortedVisitors].map((m) => {
          const isVisitor = !("firstName" in m);
          const id = m.id;
          const name = isVisitor ? m.name : `${m.firstName} ${m.lastName}`;
          const present = records[id] === true;

          return (
            <Card
              key={id}
              className={cn(
                "relative group p-3 flex flex-col items-center text-center gap-1.5 cursor-pointer rounded-md transition-colors",
                present
                  ? "bg-green-700/80 border border-green-500/20"
                  : "bg-red-700/80 border border-red-500/20"
              )}
              onClick={() => toggle(id)}
            >
              {isVisitor && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setVisitors((prev) => prev.filter((v) => v.id !== id));
                  }}
                  className="
                    absolute top-1.5 right-1.5
                    h-4 w-4 flex items-center justify-center
                    rounded-full bg-black/40 border border-white/10
                    text-white/60 hover:text-white hover:bg-black/60
                    opacity-0 group-hover:opacity-100 transition
                  "
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}

              {/* Title */}
              <span className="text-[10px] text-white/50 font-semibold tracking-wide uppercase">
                {isVisitor ? "Visitor" : "Member"}
              </span>

              {/* Name */}
              <span
                className="
                  text-[11px] font-medium leading-tight
                  text-center
                  w-full
                  max-w-[80px]
                  line-clamp-2
                "
              >
                {name}
              </span>

              {/* Status (always white) */}
              <span className="text-white/80 font-semibold text-[10px]">
                {present ? "Present" : "Absent"}
              </span>
            </Card>
          );
        })}
      </div>

      {/* SAVE BUTTON */}
      <Fab
        onClick={async () => {
          await save();
          toast({ title: "Attendance saved" });
        }}
        type="save"
      />

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
