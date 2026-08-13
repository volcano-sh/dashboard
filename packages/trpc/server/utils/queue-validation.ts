type ResourcePair = { cpu: string; memory: string };

// Matches a plain Kubernetes CPU quantity: whole/decimal cores, or millicores with the "m" suffix.
const CPU_QUANTITY_PATTERN = /^(\d+(?:\.\d+)?)(m)?$/;

function parseCpuToMillicores(value: string): number | null {
    const v = value.trim();
    if (!v) return null;
    const match = CPU_QUANTITY_PATTERN.exec(v);
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
    K: 1000,
};

function parseMemoryToBytes(value: string): number | null {
    const v = value.trim();
    if (!v) return null;
    const match = /^(\d+(?:\.\d+)?)(Ei|Pi|Ti|Gi|Mi|Ki|E|P|T|G|M|K)?$/i.exec(v);
    if (!match) return null;
    const amount = Number.parseFloat(match[1]!);
    if (!Number.isFinite(amount)) return null;
    const suffix = match[2];
    if (!suffix) return amount;
    const mult = MEMORY_MULTIPLIERS[suffix[0]!.toUpperCase() + suffix.slice(1).toLowerCase()];
    return mult ? amount * mult : null;
}

function resourcePairFromSpecBlock(
    block: unknown,
    nestedResourceKey?: string
): ResourcePair {
    if (!block || typeof block !== "object") {
        return { cpu: "", memory: "" };
    }
    const o = block as Record<string, unknown>;
    const resource =
        nestedResourceKey && o[nestedResourceKey] && typeof o[nestedResourceKey] === "object"
            ? (o[nestedResourceKey] as Record<string, unknown>)
            : o;
    return {
        cpu: resource.cpu != null ? String(resource.cpu) : "",
        memory: resource.memory != null ? String(resource.memory) : "",
    };
}

function normalizeDeservedFromGuarantee(
    guarantee: ResourcePair,
    deserved: ResourcePair
): ResourcePair {
    return {
        cpu: deserved.cpu.trim() || guarantee.cpu.trim(),
        memory: deserved.memory.trim() || guarantee.memory.trim(),
    };
}

function compareCpu(deserved: string, limit: string, relation: "gte" | "lte"): boolean | null {
    const d = parseCpuToMillicores(deserved);
    const l = parseCpuToMillicores(limit);
    if (d === null || l === null) return null;
    return relation === "gte" ? d >= l : d <= l;
}

function compareMemory(deserved: string, limit: string, relation: "gte" | "lte"): boolean | null {
    const d = parseMemoryToBytes(deserved);
    const l = parseMemoryToBytes(limit);
    if (d === null || l === null) return null;
    return relation === "gte" ? d >= l : d <= l;
}

// A non-empty value that fails to parse is a malformed quantity, not merely "nothing to compare".
function checkQuantityFormat(pair: ResourcePair, fieldLabel: string, messages: string[]): void {
    if (pair.cpu.trim() && parseCpuToMillicores(pair.cpu) === null) {
        messages.push(`${fieldLabel} CPU is not a valid Kubernetes CPU quantity: "${pair.cpu.trim()}"`);
    }
    if (pair.memory.trim() && parseMemoryToBytes(pair.memory) === null) {
        messages.push(`${fieldLabel} memory is not a valid Kubernetes memory quantity: "${pair.memory.trim()}"`);
    }
}

function validateQueueResources(
    guarantee: ResourcePair,
    capability: ResourcePair,
    deserved: ResourcePair
): { valid: boolean; messages: string[] } {
    const messages: string[] = [];
    const d = normalizeDeservedFromGuarantee(guarantee, deserved);

    // Malformed quantities are always invalid, regardless of whether there is
    // anything to compare them against (compareCpu/compareMemory return null,
    // not false, when a side fails to parse — that must not be read as "ok").
    // Check the raw deserved input (not the guarantee-normalized `d`) so an
    // empty deserved field never gets blamed for a malformed guarantee value.
    checkQuantityFormat(guarantee, "Guarantee", messages);
    checkQuantityFormat(capability, "Capability", messages);
    checkQuantityFormat(deserved, "Deserved", messages);

    if (guarantee.cpu.trim() && !d.cpu.trim()) {
        messages.push("Deserved CPU is required when guarantee CPU is set.");
    } else if (guarantee.cpu.trim() && d.cpu.trim() && compareCpu(d.cpu, guarantee.cpu, "gte") === false) {
        messages.push(`Deserved CPU (${d.cpu.trim()}) must be ≥ guarantee CPU (${guarantee.cpu.trim()}).`);
    }

    if (guarantee.memory.trim() && !d.memory.trim()) {
        messages.push("Deserved memory is required when guarantee memory is set.");
    } else if (
        guarantee.memory.trim() &&
        d.memory.trim() &&
        compareMemory(d.memory, guarantee.memory, "gte") === false
    ) {
        messages.push(
            `Deserved memory (${d.memory.trim()}) must be ≥ guarantee memory (${guarantee.memory.trim()}).`
        );
    }

    if (capability.cpu.trim() && d.cpu.trim() && compareCpu(d.cpu, capability.cpu, "lte") === false) {
        messages.push(`Deserved CPU (${d.cpu.trim()}) must be ≤ capability CPU (${capability.cpu.trim()}).`);
    }

    if (
        capability.memory.trim() &&
        d.memory.trim() &&
        compareMemory(d.memory, capability.memory, "lte") === false
    ) {
        messages.push(
            `Deserved memory (${d.memory.trim()}) must be ≤ capability memory (${capability.memory.trim()}).`
        );
    }

    return { valid: messages.length === 0, messages };
}

/** Validate Volcano queue resource constraints before calling the API. */
export function validateQueueManifestSpec(spec: Record<string, unknown>): string | null {
    const guarantee = resourcePairFromSpecBlock(spec.guarantee, "resource");
    const capability = resourcePairFromSpecBlock(spec.capability);
    const deserved = resourcePairFromSpecBlock(spec.deserved);

    const { valid, messages } = validateQueueResources(guarantee, capability, deserved);
    return valid ? null : messages[0] ?? "Invalid resource configuration";
}
