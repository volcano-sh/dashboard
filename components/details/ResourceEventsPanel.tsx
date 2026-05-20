import React from "react";
import { Alert, Box, CircularProgress } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getApiErrorMessage } from "../../lib/client/dashboard-api";
import { EventsTable } from "./DetailComponents";

const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "-";

export const ResourceEventsTable = ({
    emptyText = "No events available.",
    events,
    formatTimestamps = false,
}) => (
    <EventsTable
        emptyText={emptyText}
        events={(events || []).map((event) => ({
            ...event,
            lastTimestamp: formatTimestamps
                ? formatDateTime(event.lastTimestamp)
                : event.lastTimestamp,
        }))}
    />
);

const ResourceEventsPanel = ({
    emptyText,
    errorMessage = "Failed to fetch resource events",
    queryFn,
    queryKey,
}) => {
    const { data, error, isFetching, isLoading } = useQuery({
        enabled: Boolean(queryFn),
        queryFn,
        queryKey,
    });

    if (isLoading || isFetching) {
        return (
            <Box
                sx={{
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "center",
                    minHeight: 220,
                }}
            >
                <CircularProgress size={22} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ boxShadow: "none" }}>
                {getApiErrorMessage(error, errorMessage)}
            </Alert>
        );
    }

    const events = (data as { items?: unknown[] })?.items || [];

    return <ResourceEventsTable emptyText={emptyText} events={events} />;
};

export default ResourceEventsPanel;
