/**
 * Regression check for: editing a Queue must not silently drop extended
 * resource quota fields (e.g. nvidia.com/gpu) from capability/guarantee/deserved
 * when the edit only touches an unrelated field such as weight.
 *
 * Exercises the actual shipped functions used by the Queue Edit dialog
 * (apps/web/src/components/(dashboard)/queues/queue-form-shared.tsx), not a
 * reimplementation, so this fails if the round-trip regresses.
 */
import {
  applyManifestToForm,
  buildSpecFromForm,
  emptyResource,
  extractResourcePair,
  parseQueueYaml,
  resourcePairToSpec,
  type ResourcePair
} from "../src/components/(dashboard)/queues/queue-form-shared";

let hasError = false;

function fail(message: string) {
  hasError = true;
  console.error(`  ✗ ${message}`);
}

function pass(message: string) {
  console.log(`  ✓ ${message}`);
}

function assertDeepEqual(actual: unknown, expected: unknown, message: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    pass(message);
  } else {
    fail(`${message}\n      expected: ${e}\n      actual:   ${a}`);
  }
}

function loadIntoForm(parsed: ReturnType<typeof parseQueueYaml>) {
  let weight = "1";
  let priority = "100";
  let reclaimable = true;
  let guarantee: ResourcePair = emptyResource();
  let capability: ResourcePair = emptyResource();
  let deserved: ResourcePair = emptyResource();

  applyManifestToForm(parsed, {
    setQueueName: () => {},
    setWeight: (v) => { weight = v; },
    setPriority: (v) => { priority = v; },
    setReclaimable: (v) => { reclaimable = v; },
    setGuarantee: (v) => { guarantee = v; },
    setCapability: (v) => { capability = v; },
    setDeserved: (v) => { deserved = v; }
  });

  return {
    get weight() { return weight; },
    set weight(v: string) { weight = v; },
    priority,
    reclaimable,
    guarantee,
    capability,
    deserved
  };
}

console.log("\n[1] extractResourcePair / resourcePairToSpec round-trip an unknown resource key");
{
  const pair = extractResourcePair({ cpu: "1", memory: "2Gi", "nvidia.com/gpu": "1" });
  assertDeepEqual(
    pair,
    { cpu: "1", memory: "2Gi", extra: { "nvidia.com/gpu": "1" } },
    "extractResourcePair captures the GPU key"
  );
  assertDeepEqual(
    resourcePairToSpec(pair),
    { cpu: "1", memory: "2Gi", "nvidia.com/gpu": "1" },
    "resourcePairToSpec writes the GPU key back"
  );
}

console.log("\n[2] Editing only the weight preserves nvidia.com/gpu in capability/guarantee/deserved");
{
  const gpuQueueYaml = `
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: ai-team
spec:
  weight: 1
  reclaimable: true
  capability:
    cpu: "64"
    memory: 256Gi
    nvidia.com/gpu: "8"
  guarantee:
    resource:
      cpu: "16"
      memory: 64Gi
      nvidia.com/gpu: "2"
  deserved:
    cpu: "16"
    memory: 64Gi
    nvidia.com/gpu: "2"
`;

  const parsed = parseQueueYaml(gpuQueueYaml);
  const form = loadIntoForm(parsed);

  // User only bumps the weight; never touches a resource field.
  form.weight = "2";

  const rebuiltSpec = buildSpecFromForm({
    weight: form.weight,
    priority: form.priority,
    reclaimable: form.reclaimable,
    guarantee: form.guarantee,
    capability: form.capability,
    deserved: form.deserved
  });

  if (rebuiltSpec.weight === 2) {
    pass("weight was actually updated (2)");
  } else {
    fail(`weight should be 2, got ${JSON.stringify(rebuiltSpec.weight)}`);
  }

  assertDeepEqual(
    rebuiltSpec.capability,
    { cpu: "64", memory: "256Gi", "nvidia.com/gpu": "8" },
    "capability keeps nvidia.com/gpu after a weight-only edit"
  );
  assertDeepEqual(
    rebuiltSpec.guarantee,
    { resource: { cpu: "16", memory: "64Gi", "nvidia.com/gpu": "2" } },
    "guarantee keeps nvidia.com/gpu after a weight-only edit"
  );
  assertDeepEqual(
    rebuiltSpec.deserved,
    { cpu: "16", memory: "64Gi", "nvidia.com/gpu": "2" },
    "deserved keeps nvidia.com/gpu after a weight-only edit"
  );
}

console.log("\n[3] Queues without extended resources round-trip unchanged (backward compatibility)");
{
  const plainYaml = `
apiVersion: scheduling.volcano.sh/v1beta1
kind: Queue
metadata:
  name: plain-team
spec:
  weight: 1
  reclaimable: true
  capability:
    cpu: "4"
    memory: 8Gi
  guarantee:
    resource:
      cpu: "1"
      memory: 2Gi
  deserved:
    cpu: "1"
    memory: 2Gi
`;
  const parsed = parseQueueYaml(plainYaml);
  const form = loadIntoForm(parsed);
  form.weight = "3";

  const rebuiltSpec = buildSpecFromForm({
    weight: form.weight,
    priority: form.priority,
    reclaimable: form.reclaimable,
    guarantee: form.guarantee,
    capability: form.capability,
    deserved: form.deserved
  });

  assertDeepEqual(rebuiltSpec.capability, { cpu: "4", memory: "8Gi" }, "capability unchanged, no stray 'extra' key");
  assertDeepEqual(rebuiltSpec.guarantee, { resource: { cpu: "1", memory: "2Gi" } }, "guarantee unchanged, no stray 'extra' key");
  assertDeepEqual(rebuiltSpec.deserved, { cpu: "1", memory: "2Gi" }, "deserved unchanged, no stray 'extra' key");
}

if (hasError) {
  console.error("\nQueue extended-resource preservation check FAILED.\n");
  process.exit(1);
}

console.log("\nAll queue extended-resource preservation checks passed.\n");
