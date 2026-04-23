import { X } from "lucide-react";
import { Card } from "@/app/components/ui/card";
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

  return (
    <Card
      className={cn(
        "relative group p-2 flex flex-col items-center text-center gap-2 cursor-pointer rounded-md transition-all duration-200",
        
        // Visitor logic
        isVisitor
          ? present
            ? "bg-gradient-to-b from-blue-500/60 to-blue-700/70 shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-white/20 backdrop-blur-md"
            : "bg-gradient-to-b from-red-500/60 to-red-700/70 shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-white/20 backdrop-blur-md"
          : // Member logic
            present
            ? "bg-gradient-to-b from-green-500/60 to-green-700/70 shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-white/20 backdrop-blur-md"
            : "bg-gradient-to-b from-red-500/60 to-red-700/70 shadow-[0_4px_12px_rgba(0,0,0,0.4)] border border-white/20 backdrop-blur-md",

        editable && "interactive-card",
        !editable && "cursor-default opacity-80"
      )}
      onClick={() => {
        if (!editable) return;
        onToggle(id);
      }}
    >
      {/* Visitor delete button */}
      {isVisitor && editable && onRemoveVisitor && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!editable) return;
            onRemoveVisitor(id);
          }}
          className="
            absolute top-1.5 right-1.5
            h-4 w-4 flex items-center justify-center
            rounded-full bg-black/80 border border-white/20
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
          max-w-[120px]
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
