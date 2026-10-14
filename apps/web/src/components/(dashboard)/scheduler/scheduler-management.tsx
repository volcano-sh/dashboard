"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@volcano/trpc/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import type { SchedulerConfig } from "@volcano/trpc/server/router/scheduler/schema";
import { ConfigEditor } from "./config-editor";

export default function SchedulerManagement() {
    const t = useTranslations("scheduler");
    const tc = useTranslations("common");
    const [draft, setDraft] = useState<SchedulerConfig | null>(null);
    const [resourceVersion, setResourceVersion] = useState<string | undefined>();
    const [serverConfig, setServerConfig] = useState<SchedulerConfig | null>(null);
    const [serverYaml, setServerYaml] = useState<string>("");
    const [isDirty, setIsDirty] = useState(false);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = trpc.schedulerRouter.getSchedulerConfig.useQuery(undefined, {
        refetchOnWindowFocus: false,
    });

    const seedFromServer = useCallback(
        (result: {
            config: SchedulerConfig;
            rawYaml: string;
            resourceVersion?: string;
        }) => {
            setDraft(structuredClone(result.config));
            setServerConfig(structuredClone(result.config));
            setServerYaml(result.rawYaml);
            setResourceVersion(result.resourceVersion);
        },
        []
    );

    useEffect(() => {
        if (data && draft === null) {
            seedFromServer(data);
        }
    }, [data, draft, seedFromServer]);

    const handleRefresh = useCallback(async () => {
        if (isDirty && !window.confirm(t("refreshConfirm"))) {
            return;
        }
        const result = await refetch();
        if (result.data) {
            seedFromServer(result.data);
        }
    }, [isDirty, refetch, seedFromServer, t]);

    const handleSaved = useCallback(
        (config: SchedulerConfig, rawYaml: string, nextResourceVersion?: string) => {
            seedFromServer({ config, rawYaml, resourceVersion: nextResourceVersion });
        },
        [seedFromServer]
    );

    const handleDiscard = useCallback(() => {
        if (!serverConfig) return;
        if (window.confirm(t("discardConfirm"))) {
            setDraft(structuredClone(serverConfig));
        }
    }, [serverConfig, t]);

    const configMapRef = `${data?.namespace ?? "volcano-system"}/${data?.name ?? "volcano-scheduler-configmap"}`;

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t("title")}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {t.rich("subtitle", {
                            configMap: configMapRef,
                            code: (chunks) => (
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {chunks}
                                </code>
                            ),
                        })}
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleRefresh()}
                    disabled={isFetching}
                >
                    {isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="h-4 w-4" />
                    )}
                    <span className="ml-2">{tc("actions.refresh")}</span>
                </Button>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t("loading")}
                </div>
            )}

            {isError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    {error?.message ?? t("loadError")}
                </div>
            )}

            {!isLoading && !isError && draft && serverConfig && (
                <ConfigEditor
                    draft={draft}
                    serverConfig={serverConfig}
                    serverYaml={serverYaml}
                    configMapRef={configMapRef}
                    resourceVersion={resourceVersion}
                    serverValidation={data?.validation}
                    onDraftChange={setDraft}
                    onDirtyChange={setIsDirty}
                    onSaved={handleSaved}
                    onDiscard={handleDiscard}
                />
            )}
        </div>
    );
}
