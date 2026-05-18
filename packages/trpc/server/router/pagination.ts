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
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    return {
        items,
        page,
        pageSize,
        total,
        totalPages,
        hasMore: page < totalPages,
    };
}
