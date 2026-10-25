"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

type SaveConfigBarProps = {
    hasChanges: boolean;
    isSaving: boolean;
    justSaved: boolean;
    onSave: () => void;
    onDiscard: () => void;
};

export function SaveConfigBar({
    hasChanges,
    isSaving,
    justSaved,
    onSave,
    onDiscard,
}: SaveConfigBarProps) {
    const t = useTranslations("scheduler.saveBar");

    return (
        <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 rounded-lg border bg-background/95 px-4 py-2.5 shadow-sm backdrop-blur">
            <div className="flex items-center gap-2 text-sm">
                {hasChanges ? (
                    <Badge
                        variant="secondary"
                        className="font-normal text-amber-700 dark:text-amber-400"
                    >
                        {t("unsavedChanges")}
                    </Badge>
                ) : justSaved ? (
                    <span className="flex items-center gap-1.5 text-green-700 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {t("saved")}
                    </span>
                ) : (
                    <span className="text-muted-foreground">
                        {t("upToDate")}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onDiscard}
                    disabled={!hasChanges || isSaving}
                >
                    {t("discard")}
                </Button>
                <Button
                    type="button"
                    size="sm"
                    onClick={onSave}
                    disabled={!hasChanges || isSaving}
                >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {t("save")}
                </Button>
            </div>
        </div>
    );
}
