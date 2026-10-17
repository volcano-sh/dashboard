export type ResourceSeverity = "healthy" | "warning" | "critical";

export type ResourceHealthSummary = {
  total: number;
  healthy: number;
  warning: number;
  critical: number;
  score: number;
  severity: ResourceSeverity;
  label: string;
  warningCount: number;
  failureCount: number;
};

const RESOURCE_SEVERITY_MAP: Record<string, ResourceSeverity> = {
  running: "healthy",
  completed: "healthy",
  succeeded: "healthy",
  successful: "healthy",
  ready: "healthy",
  active: "healthy",
  pending: "warning",
  inqueue: "warning",
  queued: "warning",
  waiting: "warning",
  unknown: "warning",
  failed: "critical",
  terminated: "critical",
  crashed: "critical",
  error: "critical",
  evicted: "critical",
};

export function normalizeResourceStatus(status?: string | null): string {
  return String(status ?? "unknown").trim().toLowerCase();
}

export function getResourceSeverity(status?: string | null): ResourceSeverity {
  const normalized = normalizeResourceStatus(status);

  if (RESOURCE_SEVERITY_MAP[normalized]) {
    return RESOURCE_SEVERITY_MAP[normalized];
  }

  if (
    normalized.includes("fail") ||
    normalized.includes("error") ||
    normalized.includes("terminate") ||
    normalized.includes("crash") ||
    normalized.includes("evict")
  ) {
    return "critical";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("waiting") ||
    normalized.includes("queue") ||
    normalized.includes("inqueue") ||
    normalized.includes("unknown")
  ) {
    return "warning";
  }

  if (
    normalized.includes("running") ||
    normalized.includes("complete") ||
    normalized.includes("succeed") ||
    normalized.includes("ready") ||
    normalized.includes("active")
  ) {
    return "healthy";
  }

  return "warning";
}

export function getSeverityLabel(severity: ResourceSeverity | string): string {
  switch (normalizeResourceStatus(severity)) {
    case "healthy":
      return "Healthy";
    case "warning":
      return "Warning";
    case "critical":
      return "Critical";
    default:
      return "Healthy";
  }
}

export function getSeverityBadgeClass(severity: ResourceSeverity | string): string {
  switch (normalizeResourceStatus(severity)) {
    case "healthy":
      return "bg-green-100 text-green-800 border border-green-200";
    case "warning":
      return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    case "critical":
      return "bg-red-100 text-red-800 border border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-200";
  }
}

export function getResourceHealthSummary<T extends { status?: string | null }>(
  resources: T[] = []
): ResourceHealthSummary {
  const counts = {
    healthy: 0,
    warning: 0,
    critical: 0,
  };

  resources.forEach((resource) => {
    const severity = getResourceSeverity(resource.status);
    counts[severity] += 1;
  });

  const total = resources.length;
  const score = total === 0 ? 100 : Math.round((counts.healthy / total) * 100);

  let severity: ResourceSeverity = "healthy";
  if (counts.critical > 0) {
    severity = "critical";
  } else if (counts.warning > 0) {
    severity = "warning";
  }

  return {
    total,
    healthy: counts.healthy,
    warning: counts.warning,
    critical: counts.critical,
    score,
    severity,
    label: getSeverityLabel(severity),
    warningCount: counts.warning,
    failureCount: counts.critical,
  };
}
