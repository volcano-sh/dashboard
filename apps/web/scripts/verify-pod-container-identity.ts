/**
 * Regression check for GitHub issue #372: Pod container edits must be matched
 * by container `name`, not by array position. Kubernetes containers have
 * stable identity through `name`; `spec.containers` ordering carries no
 * identity meaning, so a user-submitted container list in a different order
 * than the live pod must not have its fields applied to the wrong container.
 *
 * Exercises the actual shipped function used by the Pod update mutation
 * (packages/trpc/server/router/pods/pods.ts), not a reimplementation, so this
 * fails if the fix regresses.
 */
import { mergeContainersByName } from "../../../packages/trpc/server/router/pods/pods";

let hasError = false;

function fail(message: string) {
  hasError = true;
  console.error(`  ✗ ${message}`);
}

function pass(message: string) {
  console.log(`  ✓ ${message}`);
}

type C = { name?: string; image?: string; imagePullPolicy?: string };

function imageOf(containers: C[], name: string): string | undefined {
  return containers.find((c) => c.name === name)?.image;
}

function pullPolicyOf(containers: C[], name: string): string | undefined {
  return containers.find((c) => c.name === name)?.imagePullPolicy;
}

console.log("\n[1] Same-order edit updates the intended container only");
{
  const existing: C[] = [
    { name: "sidecar-log-shipper", image: "fluentd:v1.16" },
    { name: "app", image: "myorg/app:1.2.0" },
  ];
  const submitted: C[] = [
    { name: "sidecar-log-shipper", image: "fluentd:v1.16" },
    { name: "app", image: "myorg/app:1.3.0" },
  ];

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  if (imageOf(result, "sidecar-log-shipper") === "fluentd:v1.16" && imageOf(result, "app") === "myorg/app:1.3.0") {
    pass("same-order edit: sidecar unchanged, app updated to myorg/app:1.3.0");
  } else {
    fail(`same-order edit produced wrong images: ${JSON.stringify(result)}`);
  }
}

console.log("\n[2] Reordered containers still resolve to the correct target (issue #372 reproduction)");
{
  const existing: C[] = [
    { name: "sidecar-log-shipper", image: "fluentd:v1.16" },
    { name: "app", image: "myorg/app:1.2.0" },
  ];
  // Submitted in reverse order relative to `existing`.
  const submitted: C[] = [
    { name: "app", image: "myorg/app:1.3.0" },
    { name: "sidecar-log-shipper", image: "fluentd:v1.16" },
  ];

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  if (imageOf(result, "app") === "myorg/app:1.3.0" && imageOf(result, "sidecar-log-shipper") === "fluentd:v1.16") {
    pass("reordered submission: app => myorg/app:1.3.0, sidecar-log-shipper unchanged (no swap)");
  } else {
    fail(`reordered submission produced a swap/mismatch: ${JSON.stringify(result)}`);
  }
}

console.log("\n[3] Omitted container is preserved unchanged");
{
  const existing: C[] = [
    { name: "sidecar-log-shipper", image: "fluentd:v1.16" },
    { name: "app", image: "myorg/app:1.2.0" },
  ];
  // Submission only includes "app"; "sidecar-log-shipper" is absent entirely.
  const submitted: C[] = [{ name: "app", image: "myorg/app:1.3.0" }];

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  if (result.length === 2 && imageOf(result, "sidecar-log-shipper") === "fluentd:v1.16" && imageOf(result, "app") === "myorg/app:1.3.0") {
    pass("omitted container preserved unchanged; submitted container still updated");
  } else {
    fail(`omitted-container case failed: ${JSON.stringify(result)}`);
  }
}

console.log("\n[4] Unrecognized submitted container name is ignored without affecting others");
{
  const existing: C[] = [
    { name: "sidecar-log-shipper", image: "fluentd:v1.16" },
    { name: "app", image: "myorg/app:1.2.0" },
  ];
  const submitted: C[] = [
    { name: "typo-name", image: "should-not-apply-anywhere" },
    { name: "app", image: "myorg/app:1.3.0" },
  ];

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  const hasGhostContainer = result.some((c) => c.name === "typo-name");
  if (!hasGhostContainer && result.length === 2 && imageOf(result, "app") === "myorg/app:1.3.0" && imageOf(result, "sidecar-log-shipper") === "fluentd:v1.16") {
    pass("unrecognized name ignored; existing containers unaffected");
  } else {
    fail(`unrecognized-name case failed: ${JSON.stringify(result)}`);
  }
}

console.log("\n[5] imagePullPolicy is matched by name on reorder, same as image");
{
  const existing: C[] = [
    { name: "sidecar-log-shipper", image: "fluentd:v1.16", imagePullPolicy: "IfNotPresent" },
    { name: "app", image: "myorg/app:1.2.0", imagePullPolicy: "IfNotPresent" },
  ];
  const submitted: C[] = [
    { name: "app", image: "myorg/app:1.2.0", imagePullPolicy: "Always" },
    { name: "sidecar-log-shipper", image: "fluentd:v1.16", imagePullPolicy: "IfNotPresent" },
  ];

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  if (pullPolicyOf(result, "app") === "Always" && pullPolicyOf(result, "sidecar-log-shipper") === "IfNotPresent") {
    pass("imagePullPolicy correctly targets 'app' on reorder, sidecar unaffected");
  } else {
    fail(`imagePullPolicy mismatch on reorder: ${JSON.stringify(result)}`);
  }
}

console.log("\n[6] initContainers are matched by name on reorder (image only, per existing field scope)");
{
  const existingInit: C[] = [
    { name: "init-fetch-config", image: "busybox:1.36" },
    { name: "init-migrate-db", image: "migrate-tool:2.0" },
  ];
  const submittedInit: C[] = [
    { name: "init-migrate-db", image: "migrate-tool:2.1" },
    { name: "init-fetch-config", image: "busybox:1.36" },
  ];

  const result = mergeContainersByName(existingInit, submittedInit, ["image"]);

  if (imageOf(result, "init-migrate-db") === "migrate-tool:2.1" && imageOf(result, "init-fetch-config") === "busybox:1.36") {
    pass("initContainers reorder: init-migrate-db updated, init-fetch-config unchanged (no swap)");
  } else {
    fail(`initContainers reorder produced a swap/mismatch: ${JSON.stringify(result)}`);
  }
}

console.log("\n[7] Single-container pod is a no-op for ordering (sanity check)");
{
  const existing: C[] = [{ name: "app", image: "myorg/app:1.2.0" }];
  const submitted: C[] = [{ name: "app", image: "myorg/app:1.3.0" }];

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  if (result.length === 1 && imageOf(result, "app") === "myorg/app:1.3.0") {
    pass("single-container pod updates correctly");
  } else {
    fail(`single-container case failed: ${JSON.stringify(result)}`);
  }
}

console.log("\n[8] Submitted container with no image/imagePullPolicy leaves existing fields untouched");
{
  const existing: C[] = [{ name: "app", image: "myorg/app:1.2.0", imagePullPolicy: "IfNotPresent" }];
  const submitted: C[] = [{ name: "app" }]; // no image, no imagePullPolicy

  const result = mergeContainersByName(existing, submitted, ["image", "imagePullPolicy"]);

  if (imageOf(result, "app") === "myorg/app:1.2.0" && pullPolicyOf(result, "app") === "IfNotPresent") {
    pass("no-field submission leaves existing image/imagePullPolicy untouched");
  } else {
    fail(`no-field submission unexpectedly changed fields: ${JSON.stringify(result)}`);
  }
}

if (hasError) {
  console.error("\nPod container identity regression check FAILED.\n");
  process.exit(1);
}

console.log("\nAll pod container identity regression checks passed.\n");
