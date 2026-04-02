import { AttendanceCard } from "./AttendanceCard";

type MemberLike = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
};

type AttendanceGridProps = {
  members: MemberLike[];
  visitors: { id: string; name: string }[];
  records: Record<string, boolean>;
  mode: "today" | "history" | "correction";
  canEdit: boolean; // ← added
  onToggle: (id: string) => void;
  onRemoveVisitor: (id: string) => void;
};

export function AttendanceGrid({
  members,
  visitors,
  records,
  mode,
  canEdit,
  onToggle,
  onRemoveVisitor,
}: AttendanceGridProps) {
  const combined = [...members, ...visitors];

  return (
    <div
      className="
        border border-white/10
        bg-white/5
        backdrop-blur-sm
        rounded-md
        p-4
      "
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-4">
        {combined.map((m) => {
          const isVisitor = !("firstName" in m);
          const id = m.id;
          const name = isVisitor
            ? m.name
            : `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim();

          const present = records[id] === true;

          return (
            <AttendanceCard
              key={id}
              id={id}
              name={name ?? ""}
              isVisitor={isVisitor}
              present={present}
              mode={mode}
              canEdit={canEdit}
              onToggle={onToggle}
              onRemoveVisitor={isVisitor ? onRemoveVisitor : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
