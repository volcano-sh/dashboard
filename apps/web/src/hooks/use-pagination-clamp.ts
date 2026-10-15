import { useEffect } from "react";

/** Reset to last valid page when total shrinks (e.g. after delete). */
export function usePaginationClamp(
  total: number,
  page: number,
  pageSize: number,
  setPage: (page: number) => void
) {
  useEffect(() => {
    const validPageSize = pageSize > 0 ? pageSize : 10;
    const totalPages = total === 0 ? 1 : Math.ceil(total / validPageSize);
    if (page > totalPages) {
      setPage(totalPages);
    } else if (page < 1) {
      setPage(1);
    }
  }, [total, page, pageSize, setPage]);
}
