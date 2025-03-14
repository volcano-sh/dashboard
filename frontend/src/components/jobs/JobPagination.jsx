import React from "react";
import { Box, MenuItem, Pagination, Select, Typography } from "@mui/material";

const JobPagination = ({ 
    pagination, 
    totalJobs, 
    handleChangePage, 
    handleChangeRowsPerPage 
}) => {
    return (
        <Box
            sx={{
                mt: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 2,
                    mb: 2,
                }}
            >
                <Typography variant="body2" sx={{ mr: 2 }}>
                    Total Jobs: {totalJobs}
                </Typography>
                <Pagination
                    count={Math.ceil(totalJobs / pagination.rowsPerPage)}
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

export default JobPagination;

