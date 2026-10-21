export type ModelServingCondition = {
  type?: string
  status?: string
  reason?: string
  message?: string
  lastTransitionTime?: string
}

export type ModelServingStatus = {
  name: string
  namespace: string
  replicas: number
  availableReplicas: number
  updatedReplicas: number
  schedulerName: string
  createdAt: Date
  status: string
  conditions: ModelServingCondition[]
  yaml?: string
}

export function modelServingStatusColor(status: string) {
  switch (status) {
    case "Available":
      return "bg-green-100 text-green-800"
    case "Progressing":
      return "bg-blue-100 text-blue-800"
    case "UpdateInProgress":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function summarizeModelServing(item: {
  spec?: { replicas?: number; schedulerName?: string }
  status?: {
    replicas?: number
    availableReplicas?: number
    updatedReplicas?: number
    conditions?: ModelServingCondition[]
  }
}): Pick<
  ModelServingStatus,
  "status" | "replicas" | "availableReplicas" | "updatedReplicas" | "schedulerName" | "conditions"
> {
  const conditions = item.status?.conditions ?? []
  const isTrue = (type: string) =>
    conditions.some((condition) => condition.type === type && condition.status === "True")

  let status = "Unknown"
  if (isTrue("Available")) {
    status = "Available"
  } else if (isTrue("UpdateInProgress")) {
    status = "UpdateInProgress"
  } else if (isTrue("Progressing")) {
    status = "Progressing"
  }

  return {
    status,
    replicas: item.status?.replicas ?? item.spec?.replicas ?? 0,
    availableReplicas: item.status?.availableReplicas ?? 0,
    updatedReplicas: item.status?.updatedReplicas ?? 0,
    schedulerName: item.spec?.schedulerName || "volcano",
    conditions,
  }
}
