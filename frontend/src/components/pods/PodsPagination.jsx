import React from "react";
import { Box, MenuItem, Pagination, Select, Typography, useTheme, useMediaQuery } from "@mui/material";

const PodsPagination = ({ totalPods, pagination, onPaginationChange }) => {
    const handleChangePage = (event, newPage) => {
        onPaginationChange(newPage, null);
    };

    const handleChangeRowsPerPage = (event) => {
        onPaginationChange(1, parseInt(event.target.value, 10));
    };
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

    return (
        <Box
            sx={{
                mt: 2,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: isMobile ? "center" : "space-between",
                alignItems: isMobile ? "stretch" : "center",
                gap: 2,
            }}
        >
            <Box
                sx={{
                    display: "flex",
                    justifyContent: isMobile ? "center" : "flex-start",
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
            </Box>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: isMobile ? 1 : 2,
                }}
            >
                <Typography variant="body2">
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
