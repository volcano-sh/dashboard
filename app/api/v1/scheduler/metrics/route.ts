import { withRead } from "../../../../../lib/server/auth";
import { fetchSchedulerMetricsSummary } from "../../../../../lib/server/queue-metrics";
import { json } from "../../../../../lib/server/api-utils";

export const runtime = "nodejs";

export const GET = withRead(async () => json(await fetchSchedulerMetricsSummary()));
