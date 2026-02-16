"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/app/lib/firebase";
import {
  collection,
  onSnapshot,
} from "firebase/firestore";
import QRCode from "react-qr-code";
import { useUserRoles } from "@/app/hooks/useUserRoles";

interface AttendanceEntry {
    id: string;
    memberId: string;
    checkInCode: string;
    timestamp: Date | { seconds: number; nanoseconds: number };
}

function toDate(ts: AttendanceEntry["timestamp"]): Date {
  if (ts instanceof Date) return ts;
  return new Date(ts.seconds * 1000);
}

export default function AttendanceDashboard() {
  const params = useParams();
  const churchId = params.churchId as string;

  const { roles } = useUserRoles(churchId);

  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<AttendanceEntry[]>([]);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [error, setError] = useState("");

  const today = new Date().toISOString().split("T")[0];

  // ------------------------------
  // LOAD TODAY'S ATTENDANCE
  // ------------------------------
  useEffect(() => {
    const ref = collection(
      db,
      "churches",
      churchId,
      "attendance",
      today,
      "entries"
    );

    const unsub = onSnapshot(ref, (snap) => {
        const list: AttendanceEntry[] = snap.docs.map((d) => {
        const data = d.data() as Omit<AttendanceEntry, "id">;

        return {
            id: d.id,
            memberId: data.memberId ?? d.id,
            checkInCode: data.checkInCode,
            timestamp: data.timestamp,
        };
        });
      setEntries(list);
      setLoading(false);
    });

    return () => unsub();
  }, [churchId, today]);

  // ------------------------------
  // GENERATE QR TOKEN
  // ------------------------------
  async function generateQr() {
    setError("");
    try {
      const idToken = await (await import("firebase/auth")).getAuth().currentUser?.getIdToken();

      const res = await fetch(`/api/${churchId}/attendance/generate-token`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Unable to generate QR token.");
        return;
      }

      setQrUrl(data.url);
      setQrModalOpen(true);
    } catch {
      setError("Network error. Try again.");
    }
  }

  const canGenerate =
    roles.includes("Admin") || roles.includes("AttendanceManager");

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Attendance — {today}</h1>

      {/* QR GENERATION */}
      {canGenerate && (
        <div>
          <button
            onClick={generateQr}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Generate QR Code
          </button>

          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      )}

      {/* QR MODAL */}
      {qrModalOpen && qrUrl && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm text-center">
            <h2 className="text-xl font-semibold mb-4">Self Check‑In</h2>

            <QRCode value={qrUrl} size={200} />

            <p className="text-sm text-gray-500 mt-4 break-all">{qrUrl}</p>

            <button
              onClick={() => setQrModalOpen(false)}
              className="mt-4 bg-gray-700 text-white px-4 py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ATTENDANCE LIST */}
      <div className="bg-white shadow rounded p-4">
        <h2 className="text-lg font-medium mb-3">Checked‑In Members</h2>

        {loading ? (
          <p>Loading...</p>
        ) : entries.length === 0 ? (
          <p>No one has checked in yet.</p>
        ) : (
            <ul className="divide-y">
                {entries.map((entry) => (
                    <li key={entry.id} className="py-3 flex justify-between">
                    <span className="font-medium">{entry.memberId}</span>
                    <span className="text-gray-600 text-sm">
                        {toDate(entry.timestamp).toLocaleTimeString()}
                    </span>
                    </li>
                ))}
            </ul>
        )}
      </div>
    </div>
  );
}
