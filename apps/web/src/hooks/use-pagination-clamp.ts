import { useEffect } from "react";

/** Reset to last valid page when total shrinks (e.g. after delete). */
export function usePaginationClamp(
  total: number,
  page: number,
  pageSize: number,
  setPage: (page: number) => void
) {
  useEffect(() => {
    const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [total, page, pageSize, setPage]);
}
