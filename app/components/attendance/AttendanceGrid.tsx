import { AttendanceCard } from "./AttendanceCard";

type MemberLike = {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string; // for visitors
};

type AttendanceGridProps = {
  members: MemberLike[];
  visitors: { id: string; name: string }[];
  records: Record<string, boolean>;
  mode: "today" | "history" | "correction";
  onToggle: (id: string) => void;
  onRemoveVisitor: (id: string) => void;
};

export function AttendanceGrid({
  members,
  visitors,
  records,
  mode,
  onToggle,
  onRemoveVisitor,
}: AttendanceGridProps) {
  const combined = [...members, ...visitors];

  return (
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
            onToggle={onToggle}
            onRemoveVisitor={isVisitor ? onRemoveVisitor : undefined}
          />
        );
      })}
    </div>
  );
}
