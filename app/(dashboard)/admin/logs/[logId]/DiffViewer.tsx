"use client";

export default function DiffViewer({
  before = {},
  after = {},
}: {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
}) {
  const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)]));

  return (
    <div className="space-y-2 text-sm">
      {keys.map((key) => {
        const oldVal = before[key];
        const newVal = after[key];

        const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

        return (
          <div
            key={key}
            className={`p-2 rounded-md ${
              changed ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-muted"
            }`}
          >
            <strong>{key}</strong>
            <div className="text-xs mt-1">
              <div><strong>Before:</strong> {JSON.stringify(oldVal)}</div>
              <div><strong>After:</strong> {JSON.stringify(newVal)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
