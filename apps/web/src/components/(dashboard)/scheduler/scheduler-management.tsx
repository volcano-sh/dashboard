"use client";

import { Button } from "@/components/ui/button";
import { trpc } from "@volcano/trpc/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { SchedulerConfig } from "@volcano/trpc/server/router/scheduler/schema";
import { ConfigEditor } from "./config-editor";

export default function SchedulerManagement() {
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
        if (
            isDirty &&
            !window.confirm(
                "You have unsaved changes. Refreshing reloads the configuration from the cluster and discards your edits. Continue?"
            )
        ) {
            return;
        }
        const result = await refetch();
        if (result.data) {
            seedFromServer(result.data);
        }
    }, [isDirty, refetch, seedFromServer]);

    const handleSaved = useCallback(
        (config: SchedulerConfig, rawYaml: string, nextResourceVersion?: string) => {
            seedFromServer({ config, rawYaml, resourceVersion: nextResourceVersion });
        },
        [seedFromServer]
    );

    const handleDiscard = useCallback(() => {
        if (!serverConfig) return;
        if (
            window.confirm(
                "Discard all unsaved changes and restore the server configuration?"
            )
        ) {
            setDraft(structuredClone(serverConfig));
        }
    }, [serverConfig]);

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Scheduler Configuration</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Edit the volcano scheduler policy in{" "}
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                            {data?.namespace ?? "volcano-system"}/
                            {data?.name ?? "volcano-scheduler-configmap"}
                        </code>
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
                    <span className="ml-2">Refresh</span>
                </Button>
            </div>

            {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Loading scheduler configuration...
                </div>
            )}

            {isError && (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                    {error?.message ?? "Failed to load scheduler configuration"}
                </div>
            )}

            {!isLoading && !isError && draft && serverConfig && (
                <ConfigEditor
                    draft={draft}
                    serverConfig={serverConfig}
                    serverYaml={serverYaml}
                    configMapRef={`${data?.namespace ?? "volcano-system"}/${data?.name ?? "volcano-scheduler-configmap"}`}
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
