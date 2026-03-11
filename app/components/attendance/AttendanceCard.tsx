import { X } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";

type AttendanceCardProps = {
  id: string;
  name: string;
  isVisitor: boolean;
  present: boolean;
  mode: "today" | "history" | "correction";
  onToggle: (id: string) => void;
  onRemoveVisitor?: (id: string) => void;
};

export function AttendanceCard({
  id,
  name,
  isVisitor,
  present,
  mode,
  onToggle,
  onRemoveVisitor,
}: AttendanceCardProps) {
  const readOnly = mode === "history";

  return (
    <Card
      className={cn(
        "relative group p-3 flex flex-col items-center text-center gap-1.5 cursor-pointer rounded-md transition-colors",
        present
          ? "bg-green-700/80 border border-green-500/20"
          : "bg-red-700/80 border border-red-500/20",
        readOnly && "cursor-default opacity-80"
      )}
      onClick={() => {
        if (readOnly) return;
        onToggle(id);
      }}
    >
      {/* Visitor delete button */}
      {isVisitor && !readOnly && onRemoveVisitor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemoveVisitor(id);
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
          text-[14px] font-medium leading-tight
          text-center
          w-full
          max-w-[80px]
        "
      >
        {name}
      </span>

      {/* Status */}
      <span className="text-white/80 font-semibold text-[10px]">
        {present ? "Present" : "Absent"}
      </span>
    </Card>
  );
}
