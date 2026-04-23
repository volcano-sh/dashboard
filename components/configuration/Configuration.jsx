import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Divider,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tabs,
    Typography,
} from "@mui/material";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const tabs = ["Scheduler Configuration", "Policies", "Plugins", "Preemption"];

const policySections = [
    {
        title: "Scheduling Algorithms",
        description:
            "The algorithm used to evaluate and select the best nodes for pods.",
        rows: [["Algorithm", "DRF (Dominant Resource Fairness)"]],
    },
    {
        title: "Queue Strategy",
        description: "Strategy for allocating resources among queues.",
        rows: [["Strategy", "Fair Share"]],
    },
    {
        title: "Job Order",
        description: "Rule for ordering jobs within queues.",
        rows: [
            ["Order By", "Priority"],
            ["Priority Weight", "100"],
        ],
    },
    {
        title: "Resource Sort Policy",
        description: "Policy for sorting resources before allocation.",
        rows: [["Resource Sort", "Binpack"]],
    },
    {
        title: "Backfill Policy",
        description:
            "Policy for backfilling jobs to improve resource utilization.",
        rows: [["Backfill", "Enabled"]],
    },
    {
        title: "Others",
        rows: [
            ["Admission Control", "Enabled"],
            ["Gang Scheduling", "Enabled"],
        ],
    },
];

const schedulerSections = [
    {
        title: "Scheduler Profile",
        description:
            "Default Volcano scheduler configuration used by this dashboard.",
        rows: [
            ["Scheduler Name", "volcano"],
            ["Policy", "capacity"],
            ["Queue Ordering", "priority"],
        ],
    },
    {
        title: "Default Actions",
        description:
            "Actions are executed in order during each scheduling cycle.",
        rows: [
            ["1", "enqueue"],
            ["2", "allocate"],
            ["3", "backfill"],
        ],
    },
    {
        title: "Runtime Options",
        description: "General scheduler behavior and cluster-level defaults.",
        rows: [
            ["Permit Plugin", "Enabled"],
            ["Node Order", "binpack"],
            ["Reclaimable", "On"],
        ],
    },
];

const preemptionSections = [
    {
        title: "Preemption",
        rows: [
            ["Preemption", "Enabled"],
            ["Default Victim Selection Policy", "BestEffort"],
        ],
    },
    {
        title: "Preemptible Scope",
        rows: [
            ["Within Queue", "Enabled"],
            ["Cross Queue", "Enabled"],
        ],
    },
    {
        title: "Priority Policy",
        description: "Higher priority jobs can preempt lower priority jobs.",
        rows: [
            ["Priority Class", "Enabled"],
            ["Preempt Lower Priority", "Yes"],
            ["Priority Class Weight", "1"],
        ],
    },
    {
        title: "Victim Selection Policy",
        description:
            "Policy used to select victim pods/jobs when preemption happens.",
        rows: [
            ["Selection Policy", "Youngest"],
            ["Order 1", "Pod Priority (Ascending)"],
            ["Order 2", "Start Time (Oldest First)"],
            ["Order 3", "Resource Usage (Ascending)"],
        ],
    },
    {
        title: "Other Settings",
        rows: [
            ["Min Available Check", "Enabled"],
            ["Non-preempting Queues", "-"],
            ["Reserved Resources Protection", "Enabled"],
        ],
        fullWidth: true,
    },
];

const pluginStages = [
    {
        title: "Enqueue",
        description: "Plugins executed when jobs are enqueued.",
        plugins: [
            ["priority", "Sort jobs by priority"],
            ["gang", "Support gang scheduling"],
        ],
    },
    {
        title: "Allocate",
        description: "Plugins executed during resource allocation.",
        plugins: [
            ["predicate", "Filter nodes by predicates"],
            ["nodeorder", "Sort nodes for better allocation"],
        ],
    },
    {
        title: "Backfill",
        description: "Plugins executed for backfilling waiting jobs.",
        plugins: [["backfill", "Backfill jobs to improve utilization"]],
    },
];

const pluginDetails = [
    ["priority", "enqueue", "Sort jobs by priority", "weight: 100"],
    [
        "gang",
        "enqueue",
        "Ensure gang scheduling for jobs",
        "minAvailablePolicy: strict",
    ],
    [
        "predicate",
        "allocate",
        "Filter nodes based on predicates",
        "predicate: [resources, taints, affinity]",
    ],
    ["nodeorder", "allocate", "Order nodes for allocation", "policy: binpack"],
    ["backfill", "backfill", "Backfill waiting jobs", "enable: true"],
];

const tableSx = {
    "& .MuiTableCell-root": {
        borderColor: "#e6e8eb",
        fontSize: 13,
        py: 0.8,
    },
    "& .MuiTableHead-root .MuiTableCell-root": {
        bgcolor: "#f7f7f7",
        color: "#2d3136",
        fontWeight: 700,
    },
};

const SectionGrid = ({ sections }) => (
    <Box
        sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
    >
        {sections.map((section) => (
            <Box
                key={section.title}
                sx={{
                    border: "1px solid #e1e4e8",
                    borderRadius: 1,
                    gridColumn: section.fullWidth ? "1 / -1" : "auto",
                    p: 2,
                }}
            >
                <KeyValueBlock section={section} compact />
            </Box>
        ))}
    </Box>
);

const KeyValueBlock = ({ section, compact = false }) => (
    <Box sx={{ mb: compact ? 0 : 3 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
            {section.title}
        </Typography>
        {section.description && (
            <Typography color="text.secondary" sx={{ fontSize: 12, mb: 0.75 }}>
                {section.description}
            </Typography>
        )}
        <TableContainer sx={{ border: "1px solid #e6e8eb", borderRadius: 1 }}>
            <Table size="small" sx={tableSx}>
                <TableBody>
                    {section.rows.map(([label, value]) => (
                        <TableRow key={label}>
                            <TableCell
                                sx={{ width: "42%", color: "text.secondary" }}
                            >
                                {label}
                            </TableCell>
                            <TableCell>{value}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

const SchedulerPanel = () => (
    <Box>
        <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
            Scheduler Configuration
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
            Configure the scheduler profile, action pipeline, and default
            runtime behavior used by Volcano.
        </Typography>
        <SectionGrid sections={schedulerSections} />
        <Box
            sx={{
                border: "1px solid #e1e4e8",
                borderRadius: 1,
                mt: 2,
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1 }}>
                Scheduling Flow
            </Typography>
            <Box
                sx={{
                    alignItems: "center",
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "1fr auto 1fr auto 1fr",
                    },
                }}
            >
                {["Enqueue", "Allocate", "Backfill"].map((step, index) => (
                    <React.Fragment key={step}>
                        <Box
                            sx={{
                                bgcolor: "#fafafa",
                                border: "1px solid #e6e8eb",
                                borderRadius: 1,
                                p: 2,
                                textAlign: "center",
                            }}
                        >
                            <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                                {step}
                            </Typography>
                            <Typography
                                color="text.secondary"
                                sx={{ fontSize: 12 }}
                            >
                                Step {index + 1}
                            </Typography>
                        </Box>
                        {index < 2 && (
                            <ArrowForwardIcon
                                sx={{
                                    color: "text.secondary",
                                    display: { xs: "none", md: "block" },
                                }}
                            />
                        )}
                    </React.Fragment>
                ))}
            </Box>
        </Box>
    </Box>
);

const PoliciesPanel = () => (
    <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
            Policies
        </Typography>
        <Box
            sx={{
                display: "grid",
                gap: 5,
                gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
            }}
        >
            <Box>
                {policySections.slice(0, 3).map((section) => (
                    <KeyValueBlock key={section.title} section={section} />
                ))}
            </Box>
            <Box>
                {policySections.slice(3).map((section) => (
                    <KeyValueBlock key={section.title} section={section} />
                ))}
            </Box>
        </Box>
    </Box>
);

const PreemptionPanel = () => (
    <Box>
        <Typography sx={{ fontSize: 17, fontWeight: 700 }}>
            Preemption Configuration
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 13, mb: 2 }}>
            Configure how Volcano preempts lower priority pods to free up
            resources for higher priority jobs.
        </Typography>
        <SectionGrid sections={preemptionSections} />
        <Box
            sx={{
                border: "1px solid #e1e4e8",
                borderRadius: 1,
                mt: 2,
                p: 2,
            }}
        >
            <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 2 }}>
                Preemption Behavior Example
            </Typography>
            <Box
                sx={{
                    alignItems: "center",
                    display: "grid",
                    gap: 2,
                    gridTemplateColumns: {
                        xs: "1fr",
                        md: "1fr auto 1fr auto 1fr",
                    },
                }}
            >
                <Box
                    sx={{ border: "1px solid #e6e8eb", borderRadius: 1, p: 2 }}
                >
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        Pending Job (High Priority)
                    </Typography>
                    <Typography sx={{ fontSize: 12, mt: 1 }}>
                        Priority: 1000
                    </Typography>
                    <Typography sx={{ fontSize: 12 }}>Queue: ai</Typography>
                </Box>
                <ArrowForwardIcon
                    sx={{
                        color: "text.secondary",
                        display: { xs: "none", md: "block" },
                    }}
                />
                <Box
                    sx={{
                        border: "1px dashed #ccd1d6",
                        borderRadius: 1,
                        p: 2,
                        textAlign: "center",
                    }}
                >
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        Victims (Low Priority)
                    </Typography>
                    <Box
                        sx={{
                            border: "1px solid #e6e8eb",
                            borderRadius: 1,
                            mt: 1,
                            p: 1,
                        }}
                    >
                        <Typography sx={{ fontSize: 12 }}>
                            Job A (Priority: 100)
                        </Typography>
                        <Divider sx={{ my: 0.75 }} />
                        <Typography sx={{ fontSize: 12 }}>
                            Job B (Priority: 200)
                        </Typography>
                    </Box>
                </Box>
                <ArrowForwardIcon
                    sx={{
                        color: "text.secondary",
                        display: { xs: "none", md: "block" },
                    }}
                />
                <Box
                    sx={{ border: "1px solid #e6e8eb", borderRadius: 1, p: 2 }}
                >
                    <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                        Pending Job Scheduled
                    </Typography>
                    <Typography sx={{ fontSize: 12, mt: 1 }}>
                        Status: Running
                    </Typography>
                </Box>
            </Box>
        </Box>
        <Box
            sx={{
                alignItems: "center",
                border: "1px solid #e1e4e8",
                borderRadius: 1,
                display: "flex",
                gap: 1,
                mt: 2,
                p: 1.5,
            }}
        >
            <KeyboardArrowRightIcon fontSize="small" />
            <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                View Raw YAML
            </Typography>
        </Box>
    </Box>
);

const PluginsPanel = () => (
    <Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>
            Plugins Configuration
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 12, mb: 2 }}>
            Volcano uses a plugin pipeline for scheduling. Plugins are executed
            in order within each extension point.
        </Typography>
        <Box
            sx={{
                alignItems: "center",
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                    xs: "1fr",
                    md: "1fr auto 1fr auto 1fr",
                },
                mb: 3,
            }}
        >
            {pluginStages.map((stage, index) => (
                <React.Fragment key={stage.title}>
                    <Box
                        sx={{
                            border: "1px solid #e1e4e8",
                            borderRadius: 1,
                            minHeight: 150,
                            p: 1.5,
                        }}
                    >
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                            {stage.title}
                        </Typography>
                        <Typography
                            color="text.secondary"
                            sx={{ fontSize: 12, mb: 1 }}
                        >
                            {stage.description}
                        </Typography>
                        <Box
                            sx={{
                                border: "1px solid #e6e8eb",
                                borderRadius: 1,
                            }}
                        >
                            {stage.plugins.map(([name, description]) => (
                                <Box
                                    key={name}
                                    sx={{
                                        borderBottom:
                                            name ===
                                            stage.plugins[
                                                stage.plugins.length - 1
                                            ][0]
                                                ? "none"
                                                : "1px solid #e6e8eb",
                                        p: 1,
                                    }}
                                >
                                    <Typography
                                        sx={{ fontSize: 13, fontWeight: 700 }}
                                    >
                                        {name}
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontSize: 12 }}
                                    >
                                        {description}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                    {index < pluginStages.length - 1 && (
                        <ArrowForwardIcon
                            sx={{
                                color: "text.secondary",
                                display: { xs: "none", md: "block" },
                            }}
                        />
                    )}
                </React.Fragment>
            ))}
        </Box>
        <Typography sx={{ fontSize: 15, fontWeight: 700, mb: 1 }}>
            Plugin Details
        </Typography>
        <TableContainer sx={{ border: "1px solid #e1e4e8", borderRadius: 1 }}>
            <Table size="small" sx={tableSx}>
                <TableHead>
                    <TableRow>
                        <TableCell>Plugin Name</TableCell>
                        <TableCell>Extension Point</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Configuration</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {pluginDetails.map(
                        ([name, extension, description, config]) => (
                            <TableRow key={name}>
                                <TableCell>{name}</TableCell>
                                <TableCell>{extension}</TableCell>
                                <TableCell>{description}</TableCell>
                                <TableCell>{config}</TableCell>
                            </TableRow>
                        ),
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    </Box>
);

const Configuration = () => {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <Box
            sx={{ bgcolor: "#f7f8fa", minHeight: "calc(100vh - 64px)", p: 0.5 }}
        >
            <Card
                sx={{
                    border: "1px solid #dfe3e8",
                    borderRadius: 1,
                    boxShadow: "none",
                }}
            >
                <CardContent sx={{ p: 3 }}>
                    <Typography
                        component="h1"
                        sx={{ fontSize: 22, fontWeight: 700, mb: 1.5 }}
                    >
                        Configuration
                    </Typography>
                    <Tabs
                        value={activeTab}
                        onChange={(event, value) => setActiveTab(value)}
                        sx={{
                            minHeight: 40,
                            "& .MuiTab-root": {
                                fontSize: 13,
                                minHeight: 40,
                                px: 2,
                                textTransform: "none",
                            },
                            "& .Mui-selected": {
                                color: "#1f2328",
                                fontWeight: 700,
                            },
                            "& .MuiTabs-indicator": {
                                bgcolor: "#1f2328",
                            },
                        }}
                    >
                        {tabs.map((tab) => (
                            <Tab key={tab} label={tab} />
                        ))}
                    </Tabs>
                    <Divider sx={{ mb: 2 }} />
                    {activeTab === 0 && <SchedulerPanel />}
                    {activeTab === 1 && <PoliciesPanel />}
                    {activeTab === 2 && <PluginsPanel />}
                    {activeTab === 3 && <PreemptionPanel />}
                </CardContent>
            </Card>
        </Box>
    );
};

export default Configuration;
