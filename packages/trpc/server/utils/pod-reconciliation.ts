import { k8sCoreApi } from "./k8s";

export type PodHealth = "Healthy" | "Warning" | "Critical";

export interface JobPodMetrics {
  totalPods: number;
  runningPods: number;
  failedPods: number;
  pendingPods: number;
  terminatingPods: number;
  restartCount: number;
  health: PodHealth;
  errorMessages: string[];
  lastError?: string;
  unhealthyPods: Array<{
    name: string;
    phase: string;
    reason?: string;
    restarts: number;
  }>;
}

/**
 * Fetch pods belonging to a specific Volcano Job
 * Uses label selector: volcano.sh/job-name={jobName}
 */
export async function getJobPods(
  namespace: string,
  jobName: string
): Promise<Array<any>> {
  try {
    const podResponse = await k8sCoreApi.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      `volcano.sh/job-name=${jobName}`
    );
    return podResponse.items || [];
  } catch (error) {
    console.error(
      `Failed to fetch pods for job ${jobName} in namespace ${namespace}:`,
      error
    );
    return [];
  }
}

/**
 * Calculate health metrics for all pods belonging to a job
 */
export async function getJobPodMetrics(
  namespace: string,
  jobName: string
): Promise<JobPodMetrics> {
  try {
    const pods = await getJobPods(namespace, jobName);

    const metrics: JobPodMetrics = {
      totalPods: pods.length,
      runningPods: 0,
      failedPods: 0,
      pendingPods: 0,
      terminatingPods: 0,
      restartCount: 0,
      health: "Healthy",
      errorMessages: [],
      unhealthyPods: [],
    };

    if (pods.length === 0) {
      return metrics;
    }

    pods.forEach((pod: any) => {
      const podName = pod.metadata?.name || "Unknown";
      const phase = pod.status?.phase || "Unknown";
      let podRestarts = 0;
      let podIsUnhealthy = false;

      // Check if pod is terminating
      if (pod.metadata?.deletionTimestamp) {
        metrics.terminatingPods++;
        return;
      }

      // Count pod statuses
      switch (phase) {
        case "Running":
          metrics.runningPods++;
          break;
        case "Failed":
          metrics.failedPods++;
          podIsUnhealthy = true;
          break;
        case "Pending":
          metrics.pendingPods++;
          break;
        default:
          break;
      }

      // Analyze container statuses for detailed information
      const containerStatuses = pod.status?.containerStatuses || [];
      const initContainerStatuses = pod.status?.initContainerStatuses || [];

      const allStatuses = [...containerStatuses, ...initContainerStatuses];

      allStatuses.forEach((cs: any) => {
        const containerName = cs.name || "Unknown";
        const restarts = cs.restartCount || 0;
        metrics.restartCount += restarts;
        podRestarts += restarts;

        // Check for waiting state
        if (cs.state?.waiting) {
          const reason = cs.state.waiting.reason || "Unknown";
          metrics.errorMessages.push(`${podName}/${containerName}: ${reason}`);
          podIsUnhealthy = true;

          // Track common failure reasons
          if (
            reason === "CrashLoopBackOff" ||
            reason === "ImagePullBackOff" ||
            reason === "ErrImagePull" ||
            reason === "InvalidImageName"
          ) {
            podIsUnhealthy = true;
          }
        }

        // Check for terminated state
        if (cs.state?.terminated) {
          const reason = cs.state.terminated.reason || "Unknown";
          const exitCode = cs.state.terminated.exitCode || 0;

          if (exitCode !== 0) {
            metrics.errorMessages.push(
              `${podName}/${containerName}: Terminated with exit code ${exitCode} (${reason})`
            );
            podIsUnhealthy = true;
          }
        }

        // Track high restart counts
        if (restarts > 3) {
          podIsUnhealthy = true;
        }
      });

      // Check for OOM or other conditions in pod status
      const conditions = pod.status?.conditions || [];
      conditions.forEach((condition: any) => {
        if (condition.type === "Ready" && condition.status === "False") {
          const reason = condition.reason || "Unknown";
          if (reason === "PodFailed" || reason === "Unschedulable") {
            metrics.errorMessages.push(`${podName}: ${reason}`);
            podIsUnhealthy = true;
          }
        }
      });

      // Add to unhealthy pods list if needed
      if (podIsUnhealthy) {
        metrics.unhealthyPods.push({
          name: podName,
          phase,
          reason:
            pod.status?.reason || pod.status?.containerStatuses?.[0]?.state?.waiting?.reason,
          restarts: podRestarts,
        });
      }
    });

    // Store first error message
    if (metrics.errorMessages.length > 0) {
      metrics.lastError = metrics.errorMessages[0];
    }

    // Determine overall health status
    metrics.health = determineHealthStatus(metrics);

    return metrics;
  } catch (error) {
    console.error(
      `Error calculating pod metrics for job ${jobName}:`,
      error
    );
    return {
      totalPods: 0,
      runningPods: 0,
      failedPods: 0,
      pendingPods: 0,
      terminatingPods: 0,
      restartCount: 0,
      health: "Critical",
      errorMessages: [
        "Failed to fetch pod metrics",
      ],
      unhealthyPods: [],
    };
  }
}

/**
 * Determine overall job health based on pod metrics
 */
export function determineHealthStatus(metrics: Omit<JobPodMetrics, "health">): PodHealth {
  // No pods
  if (metrics.totalPods === 0) {
    return "Healthy";
  }

  // Any failed pods = Critical
  if (metrics.failedPods > 0) {
    return "Critical";
  }

  // Any unhealthy pods detected
  if (metrics.unhealthyPods.length > 0) {
    return "Critical";
  }

  // High restart count = Critical
  if (metrics.restartCount > 5) {
    return "Critical";
  }

  // Pods still pending or restarting = Warning
  if (metrics.pendingPods > 0 || metrics.restartCount > 0) {
    return "Warning";
  }

  // All pods running = Healthy
  if (
    metrics.runningPods === metrics.totalPods &&
    metrics.terminatingPods === 0
  ) {
    return "Healthy";
  }

  return "Warning";
}

/**
 * Get human-readable summary of pod health
 */
export function getPodHealthSummary(metrics: JobPodMetrics): string {
  if (metrics.totalPods === 0) {
    return "No pods";
  }

  const parts: string[] = [];

  if (metrics.failedPods > 0) {
    parts.push(`${metrics.failedPods} failed`);
  }

  if (metrics.unhealthyPods.length > 0) {
    parts.push(`${metrics.unhealthyPods.length} unhealthy`);
  }

  if (metrics.restartCount > 0) {
    parts.push(`${metrics.restartCount} restarts`);
  }

  if (metrics.pendingPods > 0 && metrics.runningPods === 0) {
    parts.push("pending");
  }

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return `${metrics.runningPods}/${metrics.totalPods} running`;
}
