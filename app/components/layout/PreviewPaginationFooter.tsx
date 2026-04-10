interface Props {
  start: number;
  end: number;
  total: number;
  page: number;
  totalPages: number;
  setPage: (fn: (p: number) => number) => void;
  label?: string;
}

export function PreviewPaginationFooter({
  start,
  end,
  total,
  page,
  totalPages,
  setPage,
  label = "records",
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      
      {/* Hidden on very small screens */}
      <p className="hidden sm:block text-xs text-muted-foreground">
        Showing {start + 1}–{Math.min(end, total)} of {total} {label}
      </p>

      <p className="text-xs text-muted-foreground">
        Page {page + 1} of {totalPages}
      </p>

      <div className="flex gap-2">
        <button
          className="
            px-2 py-1 border rounded text-xs
            hover:bg-muted transition
            disabled:opacity-50 disabled:hover:bg-transparent
          "
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          &lt;
        </button>

        <button
          className="
            px-2 py-1 border rounded text-xs
            hover:bg-muted transition
            disabled:opacity-50 disabled:hover:bg-transparent
          "
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          &gt;
        </button>

        <button
          className="
            px-2 py-1 border rounded text-xs
            hover:bg-muted transition
            disabled:opacity-50 disabled:hover:bg-transparent
          "
          onClick={() => setPage(() => totalPages - 1)}
          disabled={page >= totalPages - 1}
        >
          &gt;&gt;
        </button>
      </div>

    </div>
  );
}
