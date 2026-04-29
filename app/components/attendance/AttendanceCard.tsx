import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

type AttendanceCardProps = {
  id: string;
  name: string;
  isVisitor: boolean;
  present: boolean;
  mode: "today" | "history" | "correction";
  canEdit: boolean;
  onToggle: (id: string) => void;
  onRemoveVisitor?: (id: string) => void;
};
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return (parts[0][0] ?? "?").toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}


export function AttendanceCard({
  id,
  name,
  isVisitor,
  present,
  mode,
  canEdit,
  onToggle,
  onRemoveVisitor,
}: AttendanceCardProps) {

  const readOnly = mode === "history";
  const editable = canEdit && !readOnly;

  const initials = getInitials(name);

  return (
    <div
      className={cn(
        "relative group flex flex-col items-center text-center gap-1.5 p-2.5 rounded-xl border transition-all duration-200 select-none",
        present
          ? isVisitor
            ? "bg-gradient-to-b from-sky-900/60 to-sky-950/80 border-sky-500/25 shadow-[0_2px_10px_rgba(56,189,248,0.12)]"
            : "bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 border-emerald-500/25 shadow-[0_2px_10px_rgba(52,211,153,0.12)]"
          : "bg-black/50 border-white/10",
        editable && "cursor-pointer hover:scale-[1.04] hover:z-10",
        !editable && "cursor-default opacity-75"
      )}
      onClick={() => {
        if (!editable) return;
        onToggle(id);
      }}
    >
      {/* Remove visitor button */}
      {isVisitor && editable && onRemoveVisitor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveVisitor(id);
          }}
          className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center rounded-full bg-black/80 border border-white/20 text-white/50 hover:text-white hover:bg-black/60 opacity-0 group-hover:opacity-100 transition"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}

      {/* Avatar */}
      <div
        className={cn(
          "w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold mt-0.5 shrink-0",
          present
            ? isVisitor
              ? "bg-sky-500/25 text-sky-200"
              : "bg-emerald-500/25 text-emerald-200"
            : "bg-white/[0.08] text-white/35"
        )}
      >
        {initials}
      </div>

      {/* Name */}
      <span className="text-[11px] font-medium leading-tight text-white/80 w-full break-words">
        {name}
      </span>

      {/* Status row */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {isVisitor && (
          <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-1.5 py-px text-[9px] font-semibold text-sky-400 leading-none">
            Guest
          </span>
        )}
        <span
          className={cn(
            "text-[10px] font-semibold",
            present
              ? isVisitor ? "text-sky-300" : "text-emerald-300"
              : "text-red-400/60"
          )}
        >
          {present ? "Present" : "Absent"}
        </span>
      </div>
    </div>
  );
}
