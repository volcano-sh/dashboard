import { describe, expect, it } from "vitest";
import { getSchedulerConfig } from "../lib/server/scheduler-config";

describe("scheduler config parser", () => {
    it("loads the configured ConfigMap key and extracts scheduler fields", async () => {
        const k8sCoreApi = {
            readNamespacedConfigMap: async ({ namespace, name }) => ({
                metadata: { name, namespace },
                data: {
                    "volcano-scheduler.conf": [
                        "schedulerName: volcano",
                        "actions: enqueue, allocate, backfill",
                        "queueOrder: priority",
                        "resourceOrder: binpack",
                        "preemption:",
                        "  enabled: true",
                        "  victimSelection: BestEffort",
                        "tiers:",
                        "  - name: enqueue",
                        "    plugins:",
                        "      - name: gang",
                        "        enabled: true",
                        "        arguments:",
                        "          strict: true",
                    ].join("\n"),
                },
            }),
        };

        const config = await getSchedulerConfig(k8sCoreApi);

        expect(config.target).toMatchObject({
            namespace: "volcano-system",
            name: "volcano-scheduler-configmap",
            key: "volcano-scheduler.conf",
        });
        expect(config.scheduler.actions).toEqual([
            "enqueue",
            "allocate",
            "backfill",
        ]);
        expect(config.policies).toMatchObject({
            queueOrder: "priority",
            resourceOrder: "binpack",
        });
        expect(config.plugins).toEqual([
            {
                tier: "enqueue",
                name: "gang",
                enabled: true,
                arguments: { strict: true },
            },
        ]);
        expect(config.preemption).toMatchObject({
            enabled: true,
            victimSelection: "BestEffort",
        });
    });
});
