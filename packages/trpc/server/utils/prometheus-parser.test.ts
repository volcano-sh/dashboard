import { describe, expect, it } from "vitest";
import { parseSchedulerMetrics } from "./prometheus-parser";

const SAMPLE_METRICS = `
# HELP volcano_unschedule_job_count Number of unschedulable jobs
# TYPE volcano_unschedule_job_count gauge
volcano_unschedule_job_count 3
# HELP volcano_unschedule_task_count Number of unschedulable tasks
# TYPE volcano_unschedule_task_count gauge
volcano_unschedule_task_count{job_id="job-a"} 2
volcano_unschedule_task_count{job_id="job-b"} 5
# HELP volcano_total_preemption_attempts Total preemption attempts
# TYPE volcano_total_preemption_attempts counter
volcano_total_preemption_attempts 12
# HELP volcano_e2e_scheduling_latency_milliseconds End-to-end scheduling latency
# TYPE volcano_e2e_scheduling_latency_milliseconds histogram
volcano_e2e_scheduling_latency_milliseconds_bucket{le="10"} 1
volcano_e2e_scheduling_latency_milliseconds_bucket{le="50"} 3
volcano_e2e_scheduling_latency_milliseconds_bucket{le="+Inf"} 4
volcano_e2e_scheduling_latency_milliseconds_sum 80
volcano_e2e_scheduling_latency_milliseconds_count 4
# HELP volcano_plugin_scheduling_latency_milliseconds Plugin scheduling latency
# TYPE volcano_plugin_scheduling_latency_milliseconds histogram
volcano_plugin_scheduling_latency_milliseconds_bucket{plugin="priority",OnSession="OnSessionOpen",le="5"} 2
volcano_plugin_scheduling_latency_milliseconds_bucket{plugin="priority",OnSession="OnSessionOpen",le="+Inf"} 2
volcano_plugin_scheduling_latency_milliseconds_sum{plugin="priority",OnSession="OnSessionOpen"} 10
volcano_plugin_scheduling_latency_milliseconds_count{plugin="priority",OnSession="OnSessionOpen"} 2
volcano_plugin_scheduling_latency_milliseconds_bucket{plugin="gang",OnSession="OnSessionClose",le="+Inf"} 1
volcano_plugin_scheduling_latency_milliseconds_sum{plugin="gang",OnSession="OnSessionClose"} 0
volcano_plugin_scheduling_latency_milliseconds_count{plugin="gang",OnSession="OnSessionClose"} 0
# HELP volcano_action_scheduling_latency_milliseconds Action scheduling latency
# TYPE volcano_action_scheduling_latency_milliseconds histogram
volcano_action_scheduling_latency_milliseconds_bucket{action="allocate",le="+Inf"} 5
volcano_action_scheduling_latency_milliseconds_sum{action="allocate"} 25
volcano_action_scheduling_latency_milliseconds_count{action="allocate"} 5
volcano_action_scheduling_latency_milliseconds_bucket{action="enqueue",le="+Inf"} 2
volcano_action_scheduling_latency_milliseconds_sum{action="enqueue"} 8
volcano_action_scheduling_latency_milliseconds_count{action="enqueue"} 2
# HELP unrelated_metric Ignored
# TYPE unrelated_metric gauge
unrelated_metric 999
`;

describe("parseSchedulerMetrics", () => {
    it("parses gauges, counters, and histogram averages", () => {
        const snapshot = parseSchedulerMetrics(SAMPLE_METRICS, "2026-08-05T00:00:00.000Z");

        expect(snapshot.unschedulableJobs).toBe(3);
        expect(snapshot.unschedulableTasks).toBe(7);
        expect(snapshot.totalPreemptions).toBe(12);
        expect(snapshot.e2eLatencyMs).toBe(20);
        expect(snapshot.scrapedAt).toBe("2026-08-05T00:00:00.000Z");

        expect(snapshot.pluginLatency).toEqual([
            { plugin: "priority", onSession: "OnSessionOpen", avgMs: 5 },
        ]);
        expect(snapshot.actionLatency).toEqual([
            { action: "allocate", avgMs: 5 },
            { action: "enqueue", avgMs: 4 },
        ]);
    });

    it("returns zeros/null when target metrics are missing", () => {
        const snapshot = parseSchedulerMetrics(
            `# HELP foo A gauge\n# TYPE foo gauge\nfoo 1\n`
        );

        expect(snapshot.unschedulableJobs).toBe(0);
        expect(snapshot.unschedulableTasks).toBe(0);
        expect(snapshot.totalPreemptions).toBe(0);
        expect(snapshot.e2eLatencyMs).toBeNull();
        expect(snapshot.pluginLatency).toEqual([]);
        expect(snapshot.actionLatency).toEqual([]);
    });
});
