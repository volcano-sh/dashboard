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
        expect(config.flow.actions).toEqual([
            {
                name: "enqueue",
                order: 1,
                title: "ENQUEUE",
                subtitle: "Admit into Queue",
                goal: "Decide whether the job can enter the scheduling queue.",
                resultSuccess: "Admitted to queue",
                resultFailure: "Rejected",
            },
            {
                name: "allocate",
                order: 2,
                title: "ALLOCATE",
                subtitle: "Allocate Resources",
                goal: "Find and reserve the best node(s) for the job.",
                resultSuccess: "Bind to node(s)",
                resultFailure: "Keep waiting",
            },
            {
                name: "backfill",
                order: 3,
                title: "BACKFILL",
                subtitle: "Utilize Idle Resources",
                goal: "Schedule lower-priority or BestEffort jobs using idle resources.",
                resultSuccess: "Utilize idle resources",
                resultFailure: "No resources",
            },
        ]);
        expect(config.flow.hooksByAction).toMatchObject({
            allocate: ["Allocatable", "PredicateFn", "NodeOrderFn", "JobReady"],
            backfill: ["PredicateFn", "NodeOrderFn"],
        });
        expect(config.flow.plugins).toEqual([
            {
                tier: "enqueue",
                name: "gang",
                enabled: true,
                arguments: { strict: true },
                description: "Ensure gang scheduling constraints.",
                hooks: [
                    "JobEnqueueable",
                    "JobEnqueued",
                    "JobReady",
                    "JobPipelined",
                ],
                actions: ["enqueue", "allocate"],
                hookMappingAvailable: true,
            },
        ]);
        expect(config.flow.stepsByAction.enqueue).toEqual([
            {
                order: 1,
                hook: "JobEnqueueable",
                label: "Step 1",
                plugins: [
                    {
                        tier: "enqueue",
                        name: "gang",
                        enabled: true,
                        arguments: { strict: true },
                        description: "Ensure gang scheduling constraints.",
                        hooks: [
                            "JobEnqueueable",
                            "JobEnqueued",
                            "JobReady",
                            "JobPipelined",
                        ],
                        actions: ["enqueue", "allocate"],
                        hookMappingAvailable: true,
                    },
                ],
            },
            {
                order: 2,
                hook: "JobEnqueued",
                label: "Step 2",
                plugins: [
                    {
                        tier: "enqueue",
                        name: "gang",
                        enabled: true,
                        arguments: { strict: true },
                        description: "Ensure gang scheduling constraints.",
                        hooks: [
                            "JobEnqueueable",
                            "JobEnqueued",
                            "JobReady",
                            "JobPipelined",
                        ],
                        actions: ["enqueue", "allocate"],
                        hookMappingAvailable: true,
                    },
                ],
            },
        ]);
        expect(config.preemption).toMatchObject({
            enabled: true,
            victimSelection: "BestEffort",
        });
    });
});
