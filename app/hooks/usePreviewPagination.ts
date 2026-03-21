import { useState, useEffect } from "react";

export function usePreviewPagination<T>(items: T[], pageSize = 20) {
  const [page, setPage] = useState(0);

  useEffect(() => {
    setPage(0);
  }, [items]);

  const start = page * pageSize;
  const end = start + pageSize;

  const visible = items.slice(start, end);
  const totalPages = Math.ceil(items.length / pageSize);

  return {
    page,
    setPage,
    start,
    end,
    visible,
    totalPages,
    total: items.length,
  };
}
