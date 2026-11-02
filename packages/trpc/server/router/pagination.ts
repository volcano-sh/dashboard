import { z } from "zod";

export const paginationInputSchema = z.object({
    page: z.number().int().min(1).default(1),
    pageSize: z.number().int().min(1).max(100).default(10),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;

export type PaginatedResponse<T> = {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
};

export function buildPaginatedResponse<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number,
): PaginatedResponse<T> {
    const safeTotal = Math.max(0, total);
    const safePageSize = pageSize > 0 ? pageSize : 10;
    const totalPages = safeTotal === 0 ? 0 : Math.ceil(safeTotal / safePageSize);
    return {
        items,
        page,
        pageSize: safePageSize,
        total: safeTotal,
        totalPages,
        hasMore: page < totalPages,
    };
}
