export type ResourcePair = { cpu: string; memory: string };

export type ResourceFieldErrors = { cpu?: string; memory?: string };

export type QueueResourceValidation = {
  valid: boolean;
  deservedErrors: ResourceFieldErrors;
  capabilityErrors: ResourceFieldErrors;
  messages: string[];
};

/** Parse Kubernetes CPU quantity to millicores for comparison. */
export function parseCpuToMillicores(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const match = /^(\d+(?:\.\d+)?)(m)?$/.exec(v);
  if (!match) return null;
  const amount = Number.parseFloat(match[1]!);
  if (!Number.isFinite(amount)) return null;
  return match[2] ? amount : amount * 1000;
}

const MEMORY_MULTIPLIERS: Record<string, number> = {
  Ei: 1024 ** 6,
  Pi: 1024 ** 5,
  Ti: 1024 ** 4,
  Gi: 1024 ** 3,
  Mi: 1024 ** 2,
  Ki: 1024,
  E: 1000 ** 6,
  P: 1000 ** 5,
  T: 1000 ** 4,
  G: 1000 ** 3,
  M: 1000 ** 2,
  k: 1000,
  m: 0.001,
};

/** Parse Kubernetes memory quantity to bytes for comparison. Suffix casing is significant. */
export function parseMemoryToBytes(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  const match = /^(\d+(?:\.\d+)?)(Ei|Pi|Ti|Gi|Mi|Ki|E|P|T|G|M|k|m)?$/.exec(v);
  if (!match) return null;
  const amount = Number.parseFloat(match[1]!);
  if (!Number.isFinite(amount)) return null;
  const suffix = match[2];
  if (!suffix) return amount;
  const mult = MEMORY_MULTIPLIERS[suffix];
  return mult ? amount * mult : null;
}

/** Fill empty deserved fields from guarantee (Volcano requires deserved >= guarantee). */
export function normalizeDeservedFromGuarantee(
  guarantee: ResourcePair,
  deserved: ResourcePair,
): ResourcePair {
  return {
    cpu: deserved.cpu.trim() || guarantee.cpu.trim(),
    memory: deserved.memory.trim() || guarantee.memory.trim(),
  };
}

function compareCpu(
  deserved: string,
  limit: string,
  relation: "gte" | "lte",
): boolean | null {
  const d = parseCpuToMillicores(deserved);
  const l = parseCpuToMillicores(limit);
  if (d === null || l === null) return null;
  return relation === "gte" ? d >= l : d <= l;
}

function compareMemory(
  deserved: string,
  limit: string,
  relation: "gte" | "lte",
): boolean | null {
  const d = parseMemoryToBytes(deserved);
  const l = parseMemoryToBytes(limit);
  if (d === null || l === null) return null;
  return relation === "gte" ? d >= l : d <= l;
}

/** Flag any non-empty field that isn't a syntactically valid quantity, independent of relational checks. */
function checkFormat(
  guarantee: ResourcePair,
  capability: ResourcePair,
  d: ResourcePair,
  deservedErrors: ResourceFieldErrors,
  capabilityErrors: ResourceFieldErrors,
  messages: string[],
): void {
  const checks: Array<{
    label: string;
    value: string;
    kind: "cpu" | "memory";
    errors: ResourceFieldErrors;
    field: "cpu" | "memory";
  }> = [
    {
      label: "Guarantee CPU",
      value: guarantee.cpu,
      kind: "cpu",
      errors: {},
      field: "cpu",
    },
    {
      label: "Guarantee memory",
      value: guarantee.memory,
      kind: "memory",
      errors: {},
      field: "memory",
    },
    {
      label: "Capability CPU",
      value: capability.cpu,
      kind: "cpu",
      errors: capabilityErrors,
      field: "cpu",
    },
    {
      label: "Capability memory",
      value: capability.memory,
      kind: "memory",
      errors: capabilityErrors,
      field: "memory",
    },
    {
      label: "Deserved CPU",
      value: d.cpu,
      kind: "cpu",
      errors: deservedErrors,
      field: "cpu",
    },
    {
      label: "Deserved memory",
      value: d.memory,
      kind: "memory",
      errors: deservedErrors,
      field: "memory",
    },
  ];

  for (const { label, value, kind, errors, field } of checks) {
    if (!value.trim()) continue;
    const parsed =
      kind === "cpu" ? parseCpuToMillicores(value) : parseMemoryToBytes(value);
    if (parsed === null && !errors[field]) {
      errors[field] =
        `"${value.trim()}" is not a valid ${kind === "cpu" ? "CPU" : "memory"} quantity`;
      messages.push(
        `${label} "${value.trim()}" is not a valid Kubernetes quantity`,
      );
    }
  }
}

/** Validate guarantee ≤ deserved ≤ capability (Volcano scheduling rules). */
export function validateQueueResources(
  guarantee: ResourcePair,
  capability: ResourcePair,
  deserved: ResourcePair,
): QueueResourceValidation {
  const deservedErrors: ResourceFieldErrors = {};
  const capabilityErrors: ResourceFieldErrors = {};
  const messages: string[] = [];

  const d = normalizeDeservedFromGuarantee(guarantee, deserved);

  checkFormat(
    guarantee,
    capability,
    d,
    deservedErrors,
    capabilityErrors,
    messages,
  );

  if (
    deservedErrors.cpu ||
    deservedErrors.memory ||
    capabilityErrors.cpu ||
    capabilityErrors.memory
  ) {
    return { valid: false, deservedErrors, capabilityErrors, messages };
  }

  if (guarantee.cpu.trim()) {
    if (!d.cpu.trim()) {
      deservedErrors.cpu = "Required when guarantee CPU is set";
      messages.push("Deserved CPU is required and must be ≥ guarantee CPU");
    } else {
      const ok = compareCpu(d.cpu, guarantee.cpu, "gte");
      if (ok === false) {
        deservedErrors.cpu = `Must be ≥ guarantee CPU (${guarantee.cpu.trim()})`;
        messages.push(
          `Deserved CPU must be ≥ guarantee CPU (${guarantee.cpu.trim()})`,
        );
      }
    }
  }

  if (guarantee.memory.trim()) {
    if (!d.memory.trim()) {
      deservedErrors.memory = "Required when guarantee memory is set";
      messages.push(
        "Deserved memory is required and must be ≥ guarantee memory",
      );
    } else {
      const ok = compareMemory(d.memory, guarantee.memory, "gte");
      if (ok === false) {
        deservedErrors.memory = `Must be ≥ guarantee memory (${guarantee.memory.trim()})`;
        messages.push(
          `Deserved memory must be ≥ guarantee memory (${guarantee.memory.trim()})`,
        );
      }
    }
  }

  if (capability.cpu.trim() && d.cpu.trim()) {
    const ok = compareCpu(d.cpu, capability.cpu, "lte");
    if (ok === false) {
      deservedErrors.cpu =
        deservedErrors.cpu ??
        `Must be ≤ capability CPU (${capability.cpu.trim()})`;
      capabilityErrors.cpu = `Must be ≥ deserved CPU (${d.cpu.trim()})`;
      messages.push(
        `Deserved CPU must be ≤ capability CPU (${capability.cpu.trim()})`,
      );
    }
  }

  if (capability.memory.trim() && d.memory.trim()) {
    const ok = compareMemory(d.memory, capability.memory, "lte");
    if (ok === false) {
      deservedErrors.memory =
        deservedErrors.memory ??
        `Must be ≤ capability memory (${capability.memory.trim()})`;
      capabilityErrors.memory = `Must be ≥ deserved memory (${d.memory.trim()})`;
      messages.push(
        `Deserved memory must be ≤ capability memory (${capability.memory.trim()})`,
      );
    }
  }

  return {
    valid: messages.length === 0,
    deservedErrors,
    capabilityErrors,
    messages,
  };
}

/** @deprecated Use validateQueueResources */
export function validateDeservedVsGuarantee(
  guarantee: ResourcePair,
  deserved: ResourcePair,
): { valid: boolean; errors: ResourceFieldErrors; messages: string[] } {
  const result = validateQueueResources(guarantee, emptyCapability(), deserved);
  return {
    valid: result.valid,
    errors: result.deservedErrors,
    messages: result.messages,
  };
}

function emptyCapability(): ResourcePair {
  return { cpu: "", memory: "" };
}

export function hasGuaranteeValues(guarantee: ResourcePair): boolean {
  return Boolean(guarantee.cpu.trim() || guarantee.memory.trim());
}

export function hasCapabilityValues(capability: ResourcePair): boolean {
  return Boolean(capability.cpu.trim() || capability.memory.trim());
}

function resourcePairFromSpecBlock(
  block: unknown,
  nestedResourceKey?: string,
): ResourcePair {
  if (!block || typeof block !== "object") return { cpu: "", memory: "" };
  const o = block as Record<string, unknown>;
  const resource =
    nestedResourceKey &&
    o[nestedResourceKey] &&
    typeof o[nestedResourceKey] === "object"
      ? (o[nestedResourceKey] as Record<string, unknown>)
      : o;
  return {
    cpu: resource.cpu != null ? String(resource.cpu) : "",
    memory: resource.memory != null ? String(resource.memory) : "",
  };
}

export function validateQueueManifestSpec(
  spec: Record<string, unknown>,
): string | null {
  const guarantee = resourcePairFromSpecBlock(spec.guarantee, "resource");
  const capability = resourcePairFromSpecBlock(spec.capability);
  const deserved = resourcePairFromSpecBlock(spec.deserved);

  const { valid, messages } = validateQueueResources(
    guarantee,
    capability,
    deserved,
  );
  return valid ? null : (messages[0] ?? "Invalid resource configuration");
}
