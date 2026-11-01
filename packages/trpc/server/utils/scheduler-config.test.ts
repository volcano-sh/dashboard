import { describe, expect, it } from "vitest";
import {
    diffSchedulerYaml,
    rawYamlToSchedulerConfig,
    schedulerConfigToRawYaml,
    validateSchedulerConfig,
} from "./scheduler-config";

describe("rawYamlToSchedulerConfig", () => {
    it("normalizes string actions and array actions", () => {
        const fromString = rawYamlToSchedulerConfig({
            actions: "enqueue, allocate, backfill",
            tiers: [],
        });
        expect(fromString.actions).toEqual(["enqueue", "allocate", "backfill"]);

        const fromArray = rawYamlToSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [],
        });
        expect(fromArray.actions).toEqual(["enqueue", "allocate"]);
    });

    it("safely handles nullish tiers and nullish plugins in tiers", () => {
        const result = rawYamlToSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [
                null as unknown as { plugins: [] },
                {
                    plugins: [
                        null as unknown as { name: string },
                        { name: "priority", enableJobOrder: true },
                    ],
                },
            ],
        });

        expect(result.tiers).toHaveLength(1);
        expect(result.tiers[0]!.plugins).toHaveLength(1);
        expect(result.tiers[0]!.plugins[0]!.name).toBe("priority");
        expect(result.tiers[0]!.plugins[0]!.enableJobOrder).toBe(true);
    });

    it("safely filters out nullish and unnamed configurations", () => {
        const result = rawYamlToSchedulerConfig({
            actions: ["enqueue"],
            tiers: [],
            configurations: [
                null as unknown as { name: string },
                { name: "" },
                {
                    name: "enqueue",
                    arguments: { "enqueue.cleanQueue": true, "oversubscribe.ratio": 1.5 },
                },
            ],
        });

        expect(result.configurations).toBeDefined();
        expect(result.configurations).toHaveLength(1);
        expect(result.configurations![0]!.name).toBe("enqueue");
        expect(result.configurations![0]!.arguments).toEqual({
            "enqueue.cleanQueue": true,
            "oversubscribe.ratio": 1.5,
        });
    });

    it("preserves metrics when valid object is provided", () => {
        const result = rawYamlToSchedulerConfig({
            actions: ["enqueue"],
            tiers: [],
            metrics: {
                plugins: ["job_schedule_duration_seconds"],
            },
        });

        expect(result.metrics).toEqual({
            plugins: ["job_schedule_duration_seconds"],
        });
    });
});

describe("schedulerConfigToRawYaml", () => {
    it("serializes config and roundtrips through rawYamlToSchedulerConfig", () => {
        const config = {
            actions: ["enqueue", "allocate", "backfill"],
            tiers: [
                {
                    plugins: [
                        { name: "priority" },
                        { name: "gang", enablePreemptable: false },
                    ],
                },
                {
                    plugins: [
                        {
                            name: "binpack",
                            arguments: { "binpack.weight": 10 },
                        },
                    ],
                },
            ],
            configurations: [
                {
                    name: "enqueue",
                    arguments: { oversubscribe: true },
                },
            ],
        };

        const yamlString = schedulerConfigToRawYaml(config);
        expect(yamlString).toContain("actions: enqueue, allocate, backfill");
        expect(yamlString).toContain("plugins:");
        expect(yamlString).toContain("name: binpack");
        expect(yamlString).toContain("binpack.weight: 10");
        expect(yamlString).toContain("name: enqueue");
    });
});

describe("validateSchedulerConfig", () => {
    const validConfig = {
        actions: ["enqueue", "allocate", "backfill"],
        tiers: [
            {
                plugins: [
                    { name: "priority" },
                    { name: "gang" },
                ],
            },
        ],
    };

    it("accepts a standard valid configuration", () => {
        const result = validateSchedulerConfig(validConfig);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toHaveLength(0);
    });

    it("errors on unknown actions and warns when essential actions are missing", () => {
        const result = validateSchedulerConfig({
            actions: ["custom_action", "backfill"],
            tiers: [{ plugins: [{ name: "priority" }] }],
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
            'Action "custom_action" is not in the built-in registry; saving may break scheduler reload'
        );
        expect(result.warnings).toContain(
            'Action "enqueue" is recommended for normal scheduling'
        );
        expect(result.warnings).toContain(
            'Action "allocate" is recommended for normal scheduling'
        );
    });

    it("warns on duplicate actions in the action pipeline", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate", "enqueue"],
            tiers: [{ plugins: [{ name: "priority" }] }],
        });

        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
            'Action "enqueue" is duplicated in the action pipeline'
        );
    });

    it("errors when a tier has no plugins or a plugin has no name", () => {
        const emptyTierResult = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [] }],
        });
        expect(emptyTierResult.valid).toBe(false);
        expect(emptyTierResult.errors).toContain(
            "Tier 1 must have at least one plugin"
        );

        const namelessPluginResult = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [{ name: "" }] }],
        });
        expect(namelessPluginResult.valid).toBe(false);
        expect(namelessPluginResult.errors).toContain(
            "Tier 1 has a plugin without a name"
        );
    });

    it("warns on unknown plugins", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [{ name: "my_custom_plugin" }] }],
        });

        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
            'Plugin "my_custom_plugin" is not in the built-in registry (custom plugin or different Volcano version?)'
        );
    });

    it("errors on duplicate plugins within the same tier and warns across tiers", () => {
        const sameTierResult = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [
                {
                    plugins: [{ name: "gang" }, { name: "gang" }],
                },
            ],
        });
        expect(sameTierResult.valid).toBe(false);
        expect(sameTierResult.errors).toContain(
            'Plugin "gang" is duplicated within tier 1'
        );

        const crossTierResult = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [
                { plugins: [{ name: "gang" }] },
                { plugins: [{ name: "gang" }] },
            ],
        });
        expect(crossTierResult.valid).toBe(true);
        expect(crossTierResult.warnings).toContain(
            'Plugin "gang" appears in multiple tiers (tier 1 and tier 2)'
        );
    });

    it("errors on plugin arguments with empty or whitespace keys", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [
                {
                    plugins: [
                        {
                            name: "binpack",
                            arguments: { "  ": "10" },
                        },
                    ],
                },
            ],
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
            'Plugin "binpack" has an argument with an empty key'
        );
    });

    it("safely handles action configuration with undefined arguments without throwing", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [{ name: "priority" }] }],
            configurations: [
                {
                    name: "enqueue",
                    arguments: undefined as unknown as Record<string, unknown>,
                },
            ],
        });

        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it("errors on duplicate action configurations", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [{ name: "priority" }] }],
            configurations: [
                { name: "enqueue", arguments: {} },
                { name: "enqueue", arguments: {} },
            ],
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
            'Action configuration for "enqueue" is duplicated'
        );
    });

    it("warns on action configuration for an action not in the pipeline", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [{ name: "priority" }] }],
            configurations: [
                { name: "reclaim", arguments: {} },
            ],
        });

        expect(result.valid).toBe(true);
        expect(result.warnings).toContain(
            'Action configuration "reclaim" configures an action that is not in the action pipeline'
        );
    });

    it("errors on action configuration arguments with empty keys", () => {
        const result = validateSchedulerConfig({
            actions: ["enqueue", "allocate"],
            tiers: [{ plugins: [{ name: "priority" }] }],
            configurations: [
                {
                    name: "enqueue",
                    arguments: { "": "value" },
                },
            ],
        });

        expect(result.valid).toBe(false);
        expect(result.errors).toContain(
            'Action configuration "enqueue" has an argument with an empty key'
        );
    });
});

describe("diffSchedulerYaml", () => {
    it("returns empty array when both inputs are empty", () => {
        expect(diffSchedulerYaml("", "")).toEqual([]);
        expect(diffSchedulerYaml("   ", "   \n")).toEqual([]);
    });

    it("correctly identifies additions when before is empty", () => {
        const diff = diffSchedulerYaml("", "actions: enqueue\n");
        expect(diff).toEqual(["+ actions: enqueue", "+ "]);
    });

    it("correctly identifies deletions when after is empty", () => {
        const diff = diffSchedulerYaml("actions: enqueue\n", "");
        expect(diff).toEqual(["- actions: enqueue", "- "]);
    });

    it("computes accurate diff for changed yaml content", () => {
        const before = [
            "actions: enqueue, allocate",
            "tiers:",
            "  - plugins:",
            "      - name: priority",
        ].join("\n");

        const after = [
            "actions: enqueue, allocate, backfill",
            "tiers:",
            "  - plugins:",
            "      - name: priority",
            "      - name: gang",
        ].join("\n");

        const diff = diffSchedulerYaml(before, after);
        expect(diff).toEqual([
            "- actions: enqueue, allocate",
            "+ actions: enqueue, allocate, backfill",
            "  tiers:",
            "  - plugins:",
            "      - name: priority",
            "+       - name: gang",
        ]);
    });
});
