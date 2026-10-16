/** Shared status → color mapping for Jobs, Pods, PodGroups, and charts. */

const BADGE = {
  success: "bg-green-100 text-green-800",
  running: "bg-blue-100 text-blue-800",
  pending: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  unknown: "bg-gray-100 text-gray-800",
} as const

const CHART = {
  success: "#22c55e",
  running: "#38bdf8",
  pending: "#eab308",
  error: "#e11d48",
  unknown: "#6b7280",
} as const

type StatusTone = keyof typeof BADGE

function getStatusTone(status: string): StatusTone {
  switch (status.toLowerCase()) {
    case "completed":
    case "succeeded":
      return "success"
    case "running":
      return "running"
    case "pending":
    case "inqueue":
      return "pending"
    case "failed":
    case "error":
    case "terminated":
    case "aborted":
      return "error"
    default:
      return "unknown"
  }
}

/** Tailwind classes for Badge components. */
export function getStatusBadgeClass(status: string): string {
  return BADGE[getStatusTone(status)]
}

/** Hex colors for Recharts / SVG. */
export function getStatusChartColor(status: string): string {
  return CHART[getStatusTone(status)]
}
