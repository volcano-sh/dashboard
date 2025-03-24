import React from "react";
import { Box, Grid, Paper, CircularProgress } from "@mui/material";
import JobStatusPieChart from "../Charts/JobStatusPieChart";
import QueueResourcesBarChart from "../Charts/QueueResourcesBarChart";

const ChartWrapper = ({ isLoading, children }) => {
    return (
        <Paper
            sx={{
                height: "calc(100vh - 250px)",
                display: "flex",
                flexDirection: "column",
                p: 2,
            }}
        >
            {isLoading ? (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        flex: 1,
                    }}
                >
                    <CircularProgress />
                </Box>
            ) : (
                <Box sx={{ height: "100%" }}>{children}</Box>
            )}
        </Paper>
    );
};

const ChartsContainer = ({ isLoading, jobs, queues }) => {
    return (
        <Grid container spacing={3} sx={{ flex: 1, minHeight: 0, mb: 3 }}>
            <Grid item xs={12} md={6}>
                <ChartWrapper isLoading={isLoading}>
                    <JobStatusPieChart data={jobs} />
                </ChartWrapper>
            </Grid>

            <Grid item xs={12} md={6}>
                <ChartWrapper isLoading={isLoading}>
                    <QueueResourcesBarChart data={queues} />
                </ChartWrapper>
            </Grid>
        </Grid>
    );
};

export default ChartsContainer;
