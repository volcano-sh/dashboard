import React from "react";
import { Box, Button, Typography } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Link from "next/link";
import { ResourceStatusCompactBars } from "../scheduling/ResourceStatus";
import { OverviewPanel, OverviewSectionHeader } from "./OverviewPanel";
import OverviewStatusChip from "./OverviewStatusChip";
import { borderColor, textMuted } from "./overviewStyles";

const SchedulerResourceAllocation = ({ rows }) => (
    <OverviewPanel sx={{ minHeight: 380 }}>
        <OverviewSectionHeader
            title="Scheduler Resource Allocation"
            subtitle="Allocated / deserved by queue"
            action={
                <Button
                    component={Link}
                    endIcon={<ChevronRightIcon sx={{ fontSize: 16 }} />}
                    href="/scheduling/queues"
                    size="small"
                    sx={{ textTransform: "none" }}
                >
                    View all queues
                </Button>
            }
        />
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "1fr minmax(290px, 1.5fr) 88px 118px 92px",
                minWidth: 820,
            }}
        >
            {["Queue", "Resources", "Weight", "Fairness Share", "Status"].map(
                (heading) => (
                    <Typography
                        key={heading}
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            color: textMuted,
                            fontSize: 12,
                            fontWeight: 700,
                            px: 1.25,
                            py: 1,
                        }}
                    >
                        {heading}
                    </Typography>
                ),
            )}
            {rows.map((row) => (
                <React.Fragment key={row.name}>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 13,
                            fontWeight: 700,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.name}
                    </Typography>
                    <Box
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            px: 1.25,
                            py: 1.05,
                        }}
                    >
                        <ResourceStatusCompactBars resources={row.resources} />
                    </Box>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 13,
                            fontWeight: 700,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.weight}
                    </Typography>
                    <Typography
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            fontSize: 13,
                            fontWeight: 700,
                            px: 1.25,
                            py: 1.3,
                        }}
                    >
                        {row.share}
                    </Typography>
                    <Box
                        sx={{
                            borderBottom: `1px solid ${borderColor}`,
                            px: 1.25,
                            py: 1.15,
                        }}
                    >
                        <OverviewStatusChip label={row.health} />
                    </Box>
                </React.Fragment>
            ))}
        </Box>
    </OverviewPanel>
);

export default SchedulerResourceAllocation;
