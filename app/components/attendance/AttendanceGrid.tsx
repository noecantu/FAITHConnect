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
  const presentMembers = members.filter((m) => records[m.id] === true).length;
  const presentVisitors = visitors.filter((v) => records[v.id] === true).length;

  return (
    <div className="space-y-6">
      {/* Members Section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] font-semibold tracking-widest uppercase text-white/30">
            Members
          </span>
          {members.length > 0 && (
            <span className="text-[11px] text-white/25">
              {presentMembers} / {members.length} present
            </span>
          )}
        </div>
        {members.length === 0 ? (
          <p className="text-white/30 text-sm italic py-4 text-center">No members found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {members.map((m) => (
              <AttendanceCard
                key={m.id}
                id={m.id}
                name={`${m.firstName ?? ""} ${m.lastName ?? ""}`.trim()}
                isVisitor={false}
                present={records[m.id] === true}
                mode={mode}
                canEdit={canEdit}
                onToggle={onToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Guests Section */}
      {visitors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-white/30">
              Guests
            </span>
            <span className="text-[11px] text-white/25">
              {presentVisitors} / {visitors.length} present
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {visitors.map((v) => (
              <AttendanceCard
                key={v.id}
                id={v.id}
                name={v.name}
                isVisitor={true}
                present={records[v.id] === true}
                mode={mode}
                canEdit={canEdit}
                onToggle={onToggle}
                onRemoveVisitor={onRemoveVisitor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
