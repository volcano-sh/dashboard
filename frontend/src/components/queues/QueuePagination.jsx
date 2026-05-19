import React from "react";
import { Box, Typography, Pagination, Select, MenuItem } from "@mui/material";
import { translations } from "../../config/translations";

const QueuePagination = ({
    pagination,
    totalQueues,
    handleChangeRowsPerPage,
    handleChangePage,
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
                <MenuItem value={5}>5 {translations.zh.perPage}</MenuItem>
                <MenuItem value={10}>10 {translations.zh.perPage}</MenuItem>
                <MenuItem value={20}>20 {translations.zh.perPage}</MenuItem>
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
                    {translations.zh.totalCountQueues}: {totalQueues}
                </Typography>
                <Pagination
                    count={Math.ceil(totalQueues / pagination.rowsPerPage)}
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

export default QueuePagination;
