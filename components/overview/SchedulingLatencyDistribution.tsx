import { Box, Tooltip, Typography } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";
import { borderColor, textMuted } from "./overviewStyles";

const formatBucketLabel = (bucket) =>
    bucket.upperBoundMs === null ? "+Inf" : `<= ${bucket.upperBoundMs} ms`;

const SchedulingLatencyDistribution = ({ buckets = [] }) => {
    const max = Math.max(...buckets.map((bucket) => bucket.bucketCount || 0), 1);
    const visibleBuckets = buckets.filter((bucket) => bucket.bucketCount > 0);
    const rows = visibleBuckets.length ? visibleBuckets : buckets.slice(0, 8);

    return (
        <OverviewPanel sx={{ minHeight: 250 }}>
            <OverviewSectionHeader
                title="Scheduling Latency Distribution"
                subtitle="Cumulative histogram buckets"
                action={
                    <Tooltip title="Values come from volcano_e2e_scheduling_latency_milliseconds_bucket in the current SchedulerMetricEndpoint scrape. This is a cumulative distribution since scheduler process start, not a time-window trend.">
                        <InfoOutlinedIcon
                            aria-label="Scheduling Latency Distribution source"
                            sx={{ color: textMuted, fontSize: 16 }}
                        />
                    </Tooltip>
                }
            />
            <Box sx={{ display: "grid", gap: 1.1 }}>
                {!rows.length && (
                    <Typography sx={{ color: textMuted, fontSize: 12.5 }}>
                        No scheduler latency bucket samples.
                    </Typography>
                )}
                {rows.map((bucket) => (
                    <Box
                        key={bucket.le}
                        sx={{
                            alignItems: "center",
                            display: "grid",
                            gap: 1,
                            gridTemplateColumns: "72px 1fr 80px",
                        }}
                    >
                        <Typography sx={{ color: textMuted, fontSize: 12 }}>
                            {formatBucketLabel(bucket)}
                        </Typography>
                        <Box
                            sx={{
                                bgcolor: "#eef1f4",
                                borderRadius: 999,
                                height: 8,
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    bgcolor: "#2f80ed",
                                    borderRadius: 999,
                                    height: "100%",
                                    width: `${Math.max(
                                        2,
                                        Math.min((bucket.bucketCount / max) * 100, 100),
                                    )}%`,
                                }}
                            />
                        </Box>
                        <Typography
                            sx={{
                                borderBottom: `1px solid ${borderColor}`,
                                fontSize: 12,
                                fontWeight: 700,
                                pb: 0.35,
                                textAlign: "right",
                            }}
                        >
                            {bucket.bucketCount} / {Number(bucket.percent || 0).toFixed(1)}%
                        </Typography>
                    </Box>
                ))}
            </Box>
        </OverviewPanel>
    );
};

export default SchedulingLatencyDistribution;
