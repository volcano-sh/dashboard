#!/usr/bin/env node

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const apiRoot = path.join(process.cwd(), "app", "api");
const httpMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
];

async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(
        entries.map(async (entry) => {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                return walk(fullPath);
            }
            return fullPath.endsWith(`${path.sep}route.js`) ? [fullPath] : [];
        }),
    );

    return files.flat();
}

function routePathFromFile(filePath) {
    const relativePath = path.relative(
        path.join(process.cwd(), "app"),
        filePath,
    );
    return `/${relativePath}`.replace(/\\/g, "/").replace(/\/route\.js$/, "");
}

function findExportedMethods(source) {
    return httpMethods.filter((method) => {
        const pattern = new RegExp(
            `export\\s+(?:async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\b`,
        );
        return pattern.test(source);
    });
}

function formatRow(method, routePath) {
    return `${method.padEnd(7)} ${routePath}`;
}

const routeFiles = await walk(apiRoot);
const rows = [];

for (const filePath of routeFiles) {
    const source = await readFile(filePath, "utf8");
    const routePath = routePathFromFile(filePath);
    const methods = findExportedMethods(source);

    if (methods.length === 0) {
        rows.push(formatRow("NONE", routePath));
        continue;
    }

    for (const method of methods) {
        rows.push(formatRow(method, routePath));
    }
}

rows.sort((left, right) => {
    const [, leftPath = ""] = left.match(/^\S+\s+(.+)$/) || [];
    const [, rightPath = ""] = right.match(/^\S+\s+(.+)$/) || [];
    return leftPath.localeCompare(rightPath) || left.localeCompare(right);
});

console.log("Dashboard API routes");
console.log("====================");
console.log(rows.join("\n"));
