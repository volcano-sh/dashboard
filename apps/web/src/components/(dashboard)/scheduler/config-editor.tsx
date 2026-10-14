"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from "@volcano/trpc/react";
import type { SchedulerConfig } from "@volcano/trpc/server/router/scheduler/schema";
import { schedulerConfigToRawYaml } from "@volcano/trpc/server/utils/scheduler-config";
import { dump } from "js-yaml";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { ActionConfigEditor } from "./action-config-editor";
import { ActionPipelineEditor } from "./action-pipeline-editor";
import { SaveConfigBar } from "./save-config-bar";
import { TierEditor } from "./tier-editor";
import { YamlDiffPreview } from "./yaml-diff-preview";

type ValidationResult = {
    valid: boolean;
    errors: string[];
    warnings: string[];
};

type ConfigEditorProps = {
    draft: SchedulerConfig;
    serverConfig: SchedulerConfig;
    serverYaml: string;
    configMapRef: string;
    resourceVersion?: string;
    serverValidation?: ValidationResult;
    onDraftChange: (config: SchedulerConfig) => void;
    onDirtyChange?: (dirty: boolean) => void;
    onSaved: (config: SchedulerConfig, rawYaml: string, resourceVersion?: string) => void;
    onDiscard: () => void;
};


function toNormalizedYaml(config: SchedulerConfig): string {
    return dump(schedulerConfigToRawYaml(config), {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    }).trim();
}

export function ConfigEditor({
    draft,
    serverConfig,
    serverYaml,
    configMapRef,
    resourceVersion,
    serverValidation,
    onDraftChange,
    onDirtyChange,
    onSaved,
    onDiscard,
}: ConfigEditorProps) {
    const t = useTranslations("scheduler");
    const tc = useTranslations("common");
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveWarnings, setSaveWarnings] = useState<string[]>([]);
    const [justSaved, setJustSaved] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const updateMutation = trpc.schedulerRouter.updateSchedulerConfig.useMutation({
        onSuccess: (result) => {
            setSaveError(null);
            setSaveWarnings(result.warnings ?? []);
            setJustSaved(true);
            setConfirmOpen(false);
            onSaved(result.config, result.rawYaml, result.resourceVersion);
        },
        onError: (err) => {
            setSaveError(err.message);
            setConfirmOpen(false);
        },
    });

    
    const serverNormalizedYaml = useMemo(
        () => toNormalizedYaml(serverConfig),
        [serverConfig]
    );
    const draftYaml = useMemo(() => toNormalizedYaml(draft), [draft]);
    const hasChanges = draftYaml !== serverNormalizedYaml;
    const isSaving = updateMutation.isLoading;

    useEffect(() => {
        onDirtyChange?.(hasChanges);
    }, [hasChanges, onDirtyChange]);

    // Guard against losing edits by closing/reloading the tab.
    useEffect(() => {
        if (!hasChanges) return;
        const handler = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", handler);
        return () => window.removeEventListener("beforeunload", handler);
    }, [hasChanges]);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "s") {
                event.preventDefault();
                if (hasChanges && !isSaving) {
                    setConfirmOpen(true);
                }
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [hasChanges, isSaving]);

    const serverYamlHasComments = useMemo(
        () => serverYaml.split("\n").some((line) => line.trimStart().startsWith("#")),
        [serverYaml]
    );

    const commentsWarning = t("alerts.commentsWarning");
    const warnings = useMemo(() => {
        const merged = [
            ...(serverValidation?.warnings ?? []),
            ...saveWarnings,
        ];
        if (serverYamlHasComments) {
            merged.push(commentsWarning);
        }
        return Array.from(new Set(merged));
    }, [serverValidation?.warnings, saveWarnings, serverYamlHasComments, commentsWarning]);

    const handleConfirmSave = () => {
        setSaveError(null);
        setSaveWarnings([]);
        setJustSaved(false);
        updateMutation.mutate({
            config: draft,
            resourceVersion,
        });
    };

    const handleDraftChange = (config: SchedulerConfig) => {
        setJustSaved(false);
        onDraftChange(config);
    };

    return (
        <div className="space-y-4">
            <SaveConfigBar
                hasChanges={hasChanges}
                isSaving={isSaving}
                justSaved={justSaved}
                onSave={() => setConfirmOpen(true)}
                onDiscard={onDiscard}
            />

            {saveError && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{t("alerts.saveFailed")}</AlertTitle>
                    <AlertDescription>{saveError}</AlertDescription>
                </Alert>
            )}

            {warnings.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle>{t("alerts.headsUp")}</AlertTitle>
                    <AlertDescription>
                        <ul className="list-disc pl-4 space-y-0.5">
                            {warnings.map((warning) => (
                                <li key={warning}>{warning}</li>
                            ))}
                        </ul>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 xl:grid-cols-[1fr,minmax(360px,480px)]">
                <div className="space-y-4 min-w-0">
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>{t("actionPipeline.title")}</CardTitle>
                            <CardDescription>
                                {t("actionPipeline.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActionPipelineEditor
                                actions={draft.actions}
                                onChange={(actions) =>
                                    handleDraftChange({ ...draft, actions })
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>{t("pluginTiers.title")}</CardTitle>
                            <CardDescription>
                                {t("pluginTiers.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <TierEditor
                                tiers={draft.tiers}
                                onChange={(tiers) =>
                                    handleDraftChange({ ...draft, tiers })
                                }
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle>{t("actionConfigs.title")}</CardTitle>
                            <CardDescription>
                                {t("actionConfigs.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActionConfigEditor
                                configurations={draft.configurations ?? []}
                                actions={draft.actions}
                                onChange={(configurations) =>
                                    handleDraftChange({ ...draft, configurations })
                                }
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="min-w-0">
                    <Card className="xl:sticky xl:top-16">
                        <CardHeader className="pb-4">
                            <CardTitle>{t("pendingChanges.title")}</CardTitle>
                            <CardDescription>
                                {t("pendingChanges.description")}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <YamlDiffPreview
                                beforeYaml={serverNormalizedYaml}
                                afterYaml={draftYaml}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog
                open={confirmOpen}
                onOpenChange={(open) => {
                    if (!isSaving) setConfirmOpen(open);
                }}
            >
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{t("confirm.title")}</DialogTitle>
                        <DialogDescription>
                            {t.rich("confirm.description", {
                                configMap: configMapRef,
                                code: (chunks) => (
                                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                        {chunks}
                                    </code>
                                ),
                            })}
                        </DialogDescription>
                    </DialogHeader>
                    <YamlDiffPreview
                        beforeYaml={serverNormalizedYaml}
                        afterYaml={draftYaml}
                        heightClass="h-[320px]"
                    />
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmOpen(false)}
                            disabled={isSaving}
                        >
                            {tc("actions.cancel")}
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirmSave}
                            disabled={isSaving}
                        >
                            {isSaving && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {t("confirm.apply")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
