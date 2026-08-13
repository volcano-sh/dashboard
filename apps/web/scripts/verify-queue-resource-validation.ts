/**
 * Regression check for GitHub issue #311: malformed Kubernetes CPU/Memory
 * quantities (e.g. "abc", "abc-not-a-number", "5abc") must be reported as
 * validation errors instead of silently passing as "no comparison violation".
 *
 * Exercises the actual shipped functions used by the Queue Create/Edit forms
 * (apps/web/src/lib/queue-validation.ts), not a reimplementation, so this
 * fails if the fix regresses.
 */
import {
  parseCpuToMillicores,
  parseMemoryToBytes,
  validateQueueResources,
  type ResourcePair
} from "../src/lib/queue-validation";

let hasError = false;

function fail(message: string) {
  hasError = true;
  console.error(`  ✗ ${message}`);
}

function pass(message: string) {
  console.log(`  ✓ ${message}`);
}

function empty(): ResourcePair {
  return { cpu: "", memory: "" };
}

function assertNull(actual: number | null, label: string) {
  if (actual === null) {
    pass(`${label} => null (rejected)`);
  } else {
    fail(`${label} should be rejected (null), got ${actual}`);
  }
}

function assertNumber(actual: number | null, expected: number, label: string) {
  if (actual === expected) {
    pass(`${label} => ${actual}`);
  } else {
    fail(`${label} should be ${expected}, got ${actual === null ? "null" : actual}`);
  }
}

console.log("\n[1] parseCpuToMillicores rejects malformed CPU quantities");
assertNull(parseCpuToMillicores("abc"), 'parseCpuToMillicores("abc")');
assertNull(parseCpuToMillicores("abc-not-a-number"), 'parseCpuToMillicores("abc-not-a-number")');
assertNull(parseCpuToMillicores("5abc"), 'parseCpuToMillicores("5abc")');

console.log("\n[2] parseMemoryToBytes rejects malformed Memory quantities");
assertNull(parseMemoryToBytes("abc"), 'parseMemoryToBytes("abc")');
assertNull(parseMemoryToBytes("abc-not-a-number"), 'parseMemoryToBytes("abc-not-a-number")');
assertNull(parseMemoryToBytes("5abc"), 'parseMemoryToBytes("5abc")');

console.log("\n[3] Valid quantities still parse correctly");
assertNumber(parseCpuToMillicores("100m"), 100, 'parseCpuToMillicores("100m")');
assertNumber(parseCpuToMillicores("500m"), 500, 'parseCpuToMillicores("500m")');
assertNumber(parseCpuToMillicores("1"), 1000, 'parseCpuToMillicores("1")');
assertNumber(parseMemoryToBytes("1Gi"), 1024 ** 3, 'parseMemoryToBytes("1Gi")');
assertNumber(parseMemoryToBytes("512Mi"), 512 * 1024 ** 2, 'parseMemoryToBytes("512Mi")');

console.log("\n[4] Isolated malformed field (nothing to compare against) is reported invalid");
{
  const cases: Array<{ label: string; guarantee: ResourcePair; capability: ResourcePair; deserved: ResourcePair }> = [
    { label: "guarantee.cpu = 'abc'", guarantee: { cpu: "abc", memory: "" }, capability: empty(), deserved: empty() },
    { label: "guarantee.memory = 'abc-not-a-number'", guarantee: { cpu: "", memory: "abc-not-a-number" }, capability: empty(), deserved: empty() },
    { label: "capability.cpu = '5abc'", guarantee: empty(), capability: { cpu: "5abc", memory: "" }, deserved: empty() },
    { label: "capability.memory = 'abc'", guarantee: empty(), capability: { cpu: "", memory: "abc" }, deserved: empty() },
    { label: "deserved.cpu = 'abc-not-a-number'", guarantee: empty(), capability: empty(), deserved: { cpu: "abc-not-a-number", memory: "" } },
    { label: "deserved.memory = '5abc'", guarantee: empty(), capability: empty(), deserved: { cpu: "", memory: "5abc" } }
  ];

  for (const c of cases) {
    const r = validateQueueResources(c.guarantee, c.capability, c.deserved);
    if (r.valid === false && r.messages.length > 0) {
      pass(`${c.label} => rejected (${r.messages[0]})`);
    } else {
      fail(`${c.label} should be rejected but validateQueueResources returned valid=true`);
    }
  }
}

console.log("\n[5] Malformed value compared against a valid counterpart is still reported invalid");
{
  const r1 = validateQueueResources({ cpu: "1", memory: "" }, empty(), { cpu: "abc", memory: "" });
  if (!r1.valid && r1.deservedErrors.cpu) {
    pass(`guarantee CPU=1, deserved CPU='abc' => deservedErrors.cpu set (${r1.deservedErrors.cpu})`);
  } else {
    fail(`guarantee CPU=1, deserved CPU='abc' should set deservedErrors.cpu`);
  }

  const r2 = validateQueueResources({ cpu: "", memory: "1Gi" }, empty(), { cpu: "", memory: "abc-not-a-number" });
  if (!r2.valid && r2.deservedErrors.memory) {
    pass(`guarantee memory=1Gi, deserved memory='abc-not-a-number' => deservedErrors.memory set (${r2.deservedErrors.memory})`);
  } else {
    fail(`guarantee memory=1Gi, deserved memory='abc-not-a-number' should set deservedErrors.memory`);
  }

  const r3 = validateQueueResources({ cpu: "1", memory: "" }, empty(), { cpu: "5abc", memory: "" });
  if (!r3.valid && r3.deservedErrors.cpu) {
    pass(`guarantee CPU=1, deserved CPU='5abc' => rejected, not silently read as 5000m`);
  } else {
    fail(`guarantee CPU=1, deserved CPU='5abc' should be rejected, not silently parsed`);
  }
}

console.log("\n[6] Malformed guarantee does not spuriously blame an empty deserved field");
{
  const r = validateQueueResources({ cpu: "abc", memory: "" }, empty(), empty());
  if (r.guaranteeErrors.cpu && !r.deservedErrors.cpu) {
    pass("malformed guarantee.cpu is attributed to guaranteeErrors, not an empty deservedErrors");
  } else {
    fail(
      `expected guaranteeErrors.cpu set and deservedErrors.cpu unset, got guaranteeErrors=${JSON.stringify(
        r.guaranteeErrors
      )} deservedErrors=${JSON.stringify(r.deservedErrors)}`
    );
  }
}

console.log("\n[7] Valid, fully-specified resources still pass (no regression on the happy path)");
{
  const r = validateQueueResources(
    { cpu: "1", memory: "1Gi" },
    { cpu: "4", memory: "4Gi" },
    { cpu: "2", memory: "2Gi" }
  );
  if (r.valid) {
    pass("guarantee=1/1Gi capability=4/4Gi deserved=2/2Gi => valid");
  } else {
    fail(`expected valid=true, got messages=${JSON.stringify(r.messages)}`);
  }
}

console.log("\n[8] Existing comparison-violation semantics are preserved (not weakened)");
{
  // deserved below guarantee: must still fail, distinct from a malformed value.
  const r = validateQueueResources({ cpu: "4", memory: "" }, empty(), { cpu: "1", memory: "" });
  if (!r.valid && r.deservedErrors.cpu) {
    pass("deserved CPU (1) < guarantee CPU (4) => still rejected as a comparison violation");
  } else {
    fail("deserved CPU (1) < guarantee CPU (4) should still be rejected");
  }
}

console.log("\n[9] Empty/optional resource fields remain valid (not a regression into over-validation)");
{
  const r = validateQueueResources(empty(), empty(), empty());
  if (r.valid) {
    pass("all-empty guarantee/capability/deserved => valid (optional fields untouched)");
  } else {
    fail(`all-empty resources should remain valid, got messages=${JSON.stringify(r.messages)}`);
  }
}

if (hasError) {
  console.error("\nQueue resource validation regression check FAILED.\n");
  process.exit(1);
}

console.log("\nAll queue resource validation regression checks passed.\n");
