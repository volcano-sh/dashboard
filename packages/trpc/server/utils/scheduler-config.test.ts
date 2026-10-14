import { describe, expect, it } from "vitest";
import {
    diffSchedulerYaml,
    parseSchedulerConfYaml,
    serializeSchedulerConf,
    validateSchedulerConfig,
} from "./scheduler-config";

const DEFAULT_INSTALL_YAML = `
actions: "enqueue, allocate, backfill"
tiers:
- plugins:
  - name: priority
  - name: gang
    enablePreemptable: false
  - name: conformance
- plugins:
  - name: overcommit
  - name: drf
    enablePreemptable: false
  - name: predicates
  - name: proportion
  - name: nodeorder
  - name: binpack
`;

describe("parseSchedulerConfYaml", () => {
    it("parses default install YAML", () => {
        const config = parseSchedulerConfYaml(DEFAULT_INSTALL_YAML);
        expect(config.actions).toEqual(["enqueue", "allocate", "backfill"]);
        expect(config.tiers).toHaveLength(2);
        expect(config.tiers[0]?.plugins[1]?.enablePreemptable).toBe(false);
        expect(config.tiers[1]?.plugins).toHaveLength(6);
    });

    it("rejects invalid YAML", () => {
        expect(() => parseSchedulerConfYaml("not: [valid")).toThrow();
    });
});

describe("serializeSchedulerConf", () => {
    it("round-trips default install config", () => {
        const config = parseSchedulerConfYaml(DEFAULT_INSTALL_YAML);
        const serialized = serializeSchedulerConf(config);
        const reparsed = parseSchedulerConfYaml(serialized);
        expect(reparsed.actions).toEqual(config.actions);
        expect(reparsed.tiers[0]?.plugins[1]?.enablePreemptable).toBe(false);
    });
});

describe("validateSchedulerConfig", () => {
    it("accepts valid config with warnings for missing recommended actions", () => {
        const config = parseSchedulerConfYaml(`
actions: "backfill"
tiers:
- plugins:
  - name: priority
`);
        const result = validateSchedulerConfig(config);
        expect(result.valid).toBe(true);
        expect(result.warnings.length).toBeGreaterThan(0);
    });

    it("rejects unknown actions (stock Volcano hard-fails on reload)", () => {
        const config = parseSchedulerConfYaml(`
actions: "enqueue, allocate, my-custom-action"
tiers:
- plugins:
  - name: priority
`);
        expect(config.actions).toContain("my-custom-action");
        const result = validateSchedulerConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("my-custom-action"))).toBe(true);
    });

    it("warns on unknown plugins without blocking", () => {
        const config = parseSchedulerConfYaml(`
actions: "enqueue, allocate"
tiers:
- plugins:
  - name: fake-plugin
`);
        const result = validateSchedulerConfig(config);
        expect(result.valid).toBe(true);
        expect(result.warnings.some((w) => w.includes("fake-plugin"))).toBe(true);
    });

    it("errors when a plugin is duplicated within the same tier", () => {
        const config = parseSchedulerConfYaml(`
actions: "enqueue, allocate"
tiers:
- plugins:
  - name: priority
  - name: priority
`);
        const result = validateSchedulerConfig(config);
        expect(result.valid).toBe(false);
        expect(
            result.errors.some((e) => e.includes("duplicated within tier"))
        ).toBe(true);
    });

    it("warns when a plugin appears in multiple tiers", () => {
        const config = parseSchedulerConfYaml(`
actions: "enqueue, allocate"
tiers:
- plugins:
  - name: priority
- plugins:
  - name: priority
`);
        const result = validateSchedulerConfig(config);
        expect(result.valid).toBe(true);
        expect(
            result.warnings.some((w) => w.includes("appears in multiple tiers"))
        ).toBe(true);
    });

    it("rejects empty argument keys", () => {
        const config = parseSchedulerConfYaml(`
actions: "enqueue, allocate"
tiers:
- plugins:
  - name: priority
`);
        config.configurations = [{ name: "enqueue", arguments: { "": "1.0" } }];
        const result = validateSchedulerConfig(config);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes("empty key"))).toBe(true);
    });
});

describe("diffSchedulerYaml", () => {
    it("shows added and removed lines", () => {
        const diff = diffSchedulerYaml("a\nb", "a\nc");
        expect(diff).toContain("- b");
        expect(diff).toContain("+ c");
        expect(diff).toContain("  a");
    });

    it("does not mark shifted lines as changed after an insertion", () => {
        const diff = diffSchedulerYaml("a\nb\nc\nd", "a\nX\nb\nc\nd");
        expect(diff).toEqual(["  a", "+ X", "  b", "  c", "  d"]);
    });

    it("handles deletions in the middle", () => {
        const diff = diffSchedulerYaml("a\nb\nc\nd", "a\nc\nd");
        expect(diff).toEqual(["  a", "- b", "  c", "  d"]);
    });
});
