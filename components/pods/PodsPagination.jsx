import React from "react";
import { Box, MenuItem, Pagination, Select, Typography } from "@mui/material";

const PodsPagination = ({
    compact = false,
    totalPods,
    pagination,
    onPaginationChange,
}) => {
    const handleChangePage = (event, newPage) => {
        onPaginationChange(newPage, null);
    };

    const handleChangeRowsPerPage = (event) => {
        onPaginationChange(1, parseInt(event.target.value, 10));
    };

    return (
        <Box
            sx={{
                mt: 2,
                display: "flex",
                justifyContent: compact ? "flex-start" : "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: compact ? 1 : 0,
            }}
        >
            <Select
                value={pagination.rowsPerPage}
                onChange={handleChangeRowsPerPage}
                size="small"
            >
                <MenuItem value={5}>5 per page</MenuItem>
                <MenuItem value={10}>10 per page</MenuItem>
                <MenuItem value={20}>20 per page</MenuItem>
            </Select>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: compact ? "flex-start" : "space-between",
                    alignItems: "center",
                    mt: compact ? 0 : 2,
                    mb: compact ? 0 : 2,
                    gap: 1.5,
                    flexWrap: "wrap",
                }}
            >
                <Typography variant="body2" sx={{ mr: compact ? 0 : 2 }}>
                    Total Pods: {totalPods}
                </Typography>
                <Pagination
                    count={Math.ceil(totalPods / pagination.rowsPerPage)}
                    page={pagination.page}
                    onChange={handleChangePage}
                    color="primary"
                    showFirstButton
                    showLastButton
                />
            </Box>
        </Box>
    );
};

export default PodsPagination;
