import React, { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { trpc } from "../utils/trpc";

//  Sample just testing the trpc query hook

const Dashboard = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Use the tRPC query hook instead of mutation
    const jobsQuery = trpc.jobsRouter.getAllJobs.useQuery(undefined, {
        onSuccess: (data) => {
            console.log("Data received:", data);
            setIsLoading(false);
        },
        onError: (err) => {
            console.error("Error fetching jobs:", err);
            setError(err.message);
            setIsLoading(false);
        }
    });

    return (
        <Box p={3}>
            <Typography variant="h4">Dashboard</Typography>
            {isLoading && <Typography>Loading...</Typography>}
            {error && <Typography color="error">{error}</Typography>}
            {!isLoading && !error && (
                <pre>{JSON.stringify(jobsQuery.data, null, 2)}</pre>
            )}
        </Box>
    );
};

export default Dashboard; 