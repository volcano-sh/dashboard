export type SchedulerMetricsSnapshot = {
    unschedulableJobs: number;
    unschedulableTasks: number;
    totalPreemptions: number;
    e2eLatencyMs: number | null;
    pluginLatency: Array<{ plugin: string; onSession: string; avgMs: number }>;
    actionLatency: Array<{ action: string; avgMs: number }>;
    scrapedAt: string;
};

type Labels = Record<string, string>;

type Sample = {
    name: string;
    labels: Labels;
    value: number;
};

// Indexed groups (not named) for broader TS target compatibility.
const SAMPLE_LINE =
    /^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{(.*)\})?\s+([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)(?:\s+\d+)?\s*$/;

function parseLabels(raw: string | undefined): Labels {
    if (!raw?.trim()) return {};
    const labels: Labels = {};
    const re = /([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*"(.*?)"/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(raw)) !== null) {
        labels[match[1]!] = match[2]!.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    }
    return labels;
}

function parseSamples(text: string): Sample[] {
    const samples: Sample[] = [];
    for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = SAMPLE_LINE.exec(trimmed);
        if (!match) continue;
        const value = Number(match[3]);
        if (!Number.isFinite(value)) continue;
        samples.push({
            name: match[1]!,
            labels: parseLabels(match[2]),
            value,
        });
    }
    return samples;
}

function labelsKey(labels: Labels): string {
    return Object.entries(labels)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join(",");
}

function histogramAverages(
    samples: Sample[],
    baseName: string
): Array<{ labels: Labels; avgMs: number }> {
    const sums = new Map<string, { labels: Labels; sum: number; count: number }>();

    for (const sample of samples) {
        if (sample.name === `${baseName}_sum`) {
            const key = labelsKey(sample.labels);
            const entry = sums.get(key) ?? { labels: sample.labels, sum: 0, count: 0 };
            entry.sum = sample.value;
            entry.labels = sample.labels;
            sums.set(key, entry);
        } else if (sample.name === `${baseName}_count`) {
            const key = labelsKey(sample.labels);
            const entry = sums.get(key) ?? { labels: sample.labels, sum: 0, count: 0 };
            entry.count = sample.value;
            entry.labels = sample.labels;
            sums.set(key, entry);
        }
    }

    const result: Array<{ labels: Labels; avgMs: number }> = [];
    Array.from(sums.values()).forEach((entry) => {
        if (entry.count <= 0) return;
        result.push({ labels: entry.labels, avgMs: entry.sum / entry.count });
    });
    return result;
}

function firstGauge(samples: Sample[], name: string): number {
    const sample = samples.find((s) => s.name === name);
    return sample?.value ?? 0;
}

function sumGauges(samples: Sample[], name: string): number {
    return samples
        .filter((s) => s.name === name)
        .reduce((total, sample) => total + sample.value, 0);
}

/**
 * Parse Prometheus text exposition into a compact scheduler metrics snapshot.
 * Only Volcano scheduler metric families needed by the Metrics tab are kept.
 *
 * Uses a focused text parser (not parse-prometheus-text-format) because that
 * library drops labels/sum/count for labeled histograms.
 */
export function parseSchedulerMetrics(
    text: string,
    scrapedAt: string = new Date().toISOString()
): SchedulerMetricsSnapshot {
    const samples = parseSamples(text);

    const e2e = histogramAverages(samples, "volcano_e2e_scheduling_latency_milliseconds");
    const e2eLatencyMs = e2e[0]?.avgMs ?? null;

    const pluginLatency = histogramAverages(
        samples,
        "volcano_plugin_scheduling_latency_milliseconds"
    )
        .map(({ labels, avgMs }) => ({
            plugin: labels.plugin ?? "unknown",
            onSession: labels.OnSession ?? labels.onSession ?? "unknown",
            avgMs,
        }))
        .sort((a, b) => b.avgMs - a.avgMs);

    const actionLatency = histogramAverages(
        samples,
        "volcano_action_scheduling_latency_milliseconds"
    )
        .map(({ labels, avgMs }) => ({
            action: labels.action ?? "unknown",
            avgMs,
        }))
        .sort((a, b) => b.avgMs - a.avgMs);

    return {
        unschedulableJobs: firstGauge(samples, "volcano_unschedule_job_count"),
        unschedulableTasks: sumGauges(samples, "volcano_unschedule_task_count"),
        totalPreemptions: firstGauge(samples, "volcano_total_preemption_attempts"),
        e2eLatencyMs,
        pluginLatency,
        actionLatency,
        scrapedAt,
    };
}
