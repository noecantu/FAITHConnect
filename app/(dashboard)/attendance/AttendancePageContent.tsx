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
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";
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
import { useSettings } from "@/app/hooks/use-settings";
import { useAuth } from "@/app/hooks/useAuth";

import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";

import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { X } from "lucide-react";

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

  const { churchId } = useChurchId();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);

  const [attendanceView, setAttendanceView] = useState<"cards" | "list">(
    "cards"
  );
  const [visitorName, setVisitorName] = useState("");

  function fallbackCopy(text: string) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  // SETTINGS
  const { settings } = useSettings();
  const savedAttendanceView = settings?.attendanceView ?? "cards";

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

  const {
    records,
    visitors,
    setVisitors,
    toggle,
    save,
    loading: attendanceLoading,
    markAllPresent,
    markAllAbsent,
  } = useAttendance(churchId, dateString);

  const loading = rolesLoading || membersLoading || attendanceLoading;

  const activeMembers = useMemo(
    () => members.filter((m) => m.status !== "Archived"),
    [members]
  );

  const sortedMembers = [...activeMembers].sort((a, b) => {
    const lastA = a.lastName.toLowerCase();
    const lastB = b.lastName.toLowerCase();

    if (lastA < lastB) return -1;
    if (lastA > lastB) return 1;

    // Last names match → compare first names
    const firstA = a.firstName.toLowerCase();
    const firstB = b.firstName.toLowerCase();

    if (firstA < firstB) return -1;
    if (firstA > firstB) return 1;

    return 0;
  });

  const sortedVisitors = [...visitors].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // QR Generator
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
        navigator.clipboard.writeText(url);
      } catch {
        fallbackCopy(url);
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
        // variant: "destructive",
      });
    } finally {
      setQrLoading(false);
    }
  }

  // Sync date when URL changes (safe: only reacts to navigation, not typing)
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
              <label htmlFor="view-cards" className="text-sm">
                Cards
              </label>
            </div>

            <div className="flex items-center gap-1">
              <RadioGroupItem value="list" id="view-list" />
              <label htmlFor="view-list" className="text-sm">
                List
              </label>
            </div>
          </RadioGroup>
        </div>
      </PageHeader>

      {/* DATE PICKER + TODAY + HISTORY */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 mb-4">

        {/* FLATPICKR DATE PICKER */}
        <Flatpickr
          value={date}
          options={{
            dateFormat: "m-d-Y",
            defaultDate: date,
            allowInput: false,
            altInput: true,
            altFormat: "m-d-Y",
            monthSelectorType: "dropdown",
          }}
          onChange={([selected]) => {
            if (!selected) return;
            setDate(selected);
            router.push(`/attendance?date=${format(selected, "yyyy-MM-dd")}`);
          }}
          className="w-full sm:w-[150px] bg-black/40 text-white border-white/20 rounded-md px-3 py-2 text-center"
        />

        {/* TODAY BUTTON */}
        <Button
          // variant="outline"
          onClick={() => {
            const today = new Date();
            setDate(today);
            router.push(`/attendance?date=${format(today, "yyyy-MM-dd")}`);
          }}
          className="text-white/80 border-white/20"
        >
          Today
        </Button>

        {/* HISTORY BUTTON */}
        <Button
          // variant="outline"
          onClick={() => router.push("/attendance/history")}
          className="text-white/80 border-white/20"
        >
          History
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* GENERATE QR */}
        <Button
          onClick={handleGenerateQr}
          variant="default"
          disabled={qrLoading}
          className="w-full flex flex-col items-center justify-center text-center gap-1 border"
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
              className="w-full flex flex-col items-center justify-center text-center gap-1 border"
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

                  // 1. Add visitor to visitor list
                  setVisitors((prev) => [
                    ...prev,
                    { id, name: visitorName.trim() },
                  ]);

                  // 2. Mark visitor as PRESENT by default
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
          className="w-full flex flex-col items-center justify-center text-center gap-1 border"
        >
          <span className="text-sm text-white/80">Mark All Present</span>
        </Button>

        <Button
          onClick={() => markAllAbsent(members, visitors)}
          variant="default"
          className="w-full flex flex-col items-center justify-center text-center gap-1 border"
        >
          <span className="text-sm text-white/80">Mark All Absent</span>
        </Button>
      </div>

      {/* CARDS VIEW */}
      {attendanceView === "cards" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {[...sortedMembers, ...sortedVisitors].map((m) => {
            const isVisitor = !("firstName" in m);
            const id = m.id;

            const name = isVisitor ? m.name : `${m.firstName} ${m.lastName}`;

            const photo =
              !isVisitor && m.profilePhotoUrl ? m.profilePhotoUrl : null;

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
          {[...sortedMembers, ...sortedVisitors].map((m) => {
            const isVisitor = !("firstName" in m);
            const id = m.id;

            const name = isVisitor ? m.name : `${m.firstName} ${m.lastName}`;

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
        }}
        type={"save"}
      />

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
