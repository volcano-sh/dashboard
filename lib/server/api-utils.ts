import { NextResponse } from "next/server";
import { getErrorMessage, getErrorStatus } from "./kubernetes";

export const json = (data, status = 200) => NextResponse.json(data, { status });

export const text = (data, status = 200, contentType = "text/yaml") =>
    new NextResponse(data, {
        status,
        headers: { "Content-Type": contentType },
    });

export const queryValue = (searchParams, key, fallback = "") =>
    searchParams.get(key) ?? fallback;

export const toInt = (value, fallback) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const apiError = (error, fallback, status = undefined) =>
    json(
        {
            error:
                error?.body?.reason ||
                error?.response?.body?.reason ||
                fallback,
            message: getErrorMessage(error, fallback),
            details: error?.body?.details || error?.response?.body?.details,
            code: status || getErrorStatus(error),
            k8s: error?.body || error?.response?.body,
        },
        status || getErrorStatus(error),
    );

export function filterBySearch(items, searchTerm, getFields) {
    if (!searchTerm) return items;
    const query = searchTerm.toLowerCase();
    return items.filter((item) =>
        getFields(item).some((field) =>
            String(field || "")
                .toLowerCase()
                .includes(query),
        ),
    );
}

export function labelEntries(labels = {}) {
    return Object.entries(labels).flatMap(([key, value]) => [
        key,
        `${key}=${value}`,
        value,
    ]);
}

export function matchesLabelFilter(labels, labelFilter) {
    const query = String(labelFilter || "")
        .trim()
        .toLowerCase();
    if (!query) return true;

    return labelEntries(labels).some((entry) =>
        String(entry || "")
            .toLowerCase()
            .includes(query),
    );
}

export function sortItems(items, sortBy, sortOrder = "asc") {
    if (!sortBy) return items;
    const direction = sortOrder === "desc" ? -1 : 1;
    return [...items].sort((a, b) => {
        const aValue = getPathValue(a, sortBy);
        const bValue = getPathValue(b, sortBy);
        if (aValue === bValue) return 0;
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        return (
            String(aValue).localeCompare(String(bValue), undefined, {
                numeric: true,
            }) * direction
        );
    });
}

export function paginate(items, page, limit) {
    if (!page || !limit) {
        return {
            items,
            totalCount: items.length,
        };
    }

    const totalCount = items.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, totalCount);

    return {
        items: items.slice(startIndex, endIndex),
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
    };
}

function getPathValue(item, path) {
    return path.split(".").reduce((value, key) => value?.[key], item);
}
