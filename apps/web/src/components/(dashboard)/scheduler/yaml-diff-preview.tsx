"use client";

import { Badge } from "@/components/ui/badge";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { diffSchedulerYaml } from "@volcano/trpc/server/utils/scheduler-config";
import { ChevronRight, FileCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

type YamlDiffPreviewProps = {
    beforeYaml: string;
    afterYaml: string;
    heightClass?: string;
};

type DiffRow =
    | { kind: "line"; text: string; type: "added" | "removed" | "context" }
    | { kind: "skip"; count: number };

const CONTEXT_LINES = 2;

/** Collapse long unchanged runs so the diff shows only changed hunks. */
function toHunkRows(diff: string[]): DiffRow[] {
    const changed = diff.map((line) => line.startsWith("+ ") || line.startsWith("- "));
    const visible = diff.map((_, i) => {
        for (
            let j = Math.max(0, i - CONTEXT_LINES);
            j <= Math.min(diff.length - 1, i + CONTEXT_LINES);
            j++
        ) {
            if (changed[j]) return true;
        }
        return false;
    });

    const rows: DiffRow[] = [];
    let skipped = 0;
    for (let i = 0; i < diff.length; i++) {
        if (!visible[i]) {
            skipped++;
            continue;
        }
        if (skipped > 0) {
            rows.push({ kind: "skip", count: skipped });
            skipped = 0;
        }
        const line = diff[i]!;
        rows.push({
            kind: "line",
            text: line.slice(2),
            type: line.startsWith("+ ")
                ? "added"
                : line.startsWith("- ")
                  ? "removed"
                  : "context",
        });
    }
    if (skipped > 0) {
        rows.push({ kind: "skip", count: skipped });
    }
    return rows;
}

export function YamlDiffPreview({
    beforeYaml,
    afterYaml,
    heightClass = "h-[520px]",
}: YamlDiffPreviewProps) {
    const t = useTranslations("scheduler.pendingChanges");
    const diff = useMemo(
        () => diffSchedulerYaml(beforeYaml, afterYaml),
        [beforeYaml, afterYaml]
    );
    const added = diff.filter((line) => line.startsWith("+ ")).length;
    const removed = diff.filter((line) => line.startsWith("- ")).length;
    const hasChanges = added > 0 || removed > 0;
    const rows = useMemo(() => toHunkRows(diff), [diff]);

    if (!hasChanges) {
        return (
            <div className="space-y-3">
                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center">
                    <FileCheck className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                        {t("noChanges")}
                    </p>
                </div>
                <Collapsible>
                    <CollapsibleTrigger className="group flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                        <ChevronRight className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-90" />
                        {t("viewCurrent")}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <ScrollArea className="mt-2 h-[360px] w-full rounded-lg border bg-muted/20">
                            <pre className="p-3 text-xs font-mono leading-5 text-muted-foreground">
                                {beforeYaml}
                            </pre>
                        </ScrollArea>
                    </CollapsibleContent>
                </Collapsible>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge
                    variant="secondary"
                    className="font-mono font-normal text-green-700 dark:text-green-400"
                >
                    +{added}
                </Badge>
                <Badge
                    variant="secondary"
                    className="font-mono font-normal text-red-700 dark:text-red-400"
                >
                    −{removed}
                </Badge>
                <span>
                    {t("linesWillChange", { count: added + removed })}
                </span>
            </div>
            <ScrollArea className={cn("w-full rounded-lg border bg-muted/20", heightClass)}>
                <pre className="p-3 text-xs font-mono leading-5">
                    {rows.map((row, index) =>
                        row.kind === "skip" ? (
                            <div
                                key={index}
                                className="-mx-3 my-0.5 border-y border-dashed bg-muted/40 px-3 py-0.5 text-center text-[11px] text-muted-foreground select-none"
                            >
                                {t("unchangedLines", { count: row.count })}
                            </div>
                        ) : (
                            <div
                                key={index}
                                className={
                                    row.type === "added"
                                        ? "-mx-3 px-3 bg-green-500/10 text-green-700 dark:text-green-400"
                                        : row.type === "removed"
                                          ? "-mx-3 px-3 bg-red-500/10 text-red-700 dark:text-red-400"
                                          : "text-muted-foreground"
                                }
                            >
                                <span className="mr-2 inline-block w-3 select-none text-center opacity-60">
                                    {row.type === "added"
                                        ? "+"
                                        : row.type === "removed"
                                          ? "−"
                                          : " "}
                                </span>
                                {row.text || " "}
                            </div>
                        )
                    )}
                </pre>
            </ScrollArea>
        </div>
    );
}
