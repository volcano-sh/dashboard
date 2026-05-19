import React from "react";
import { Box, Typography, Pagination, Select, MenuItem } from "@mui/material";
import { queueTranslations } from "./translations";

const QueuePagination = ({
    pagination,
    totalQueues,
    handleChangeRowsPerPage,
    handleChangePage,
}) => {
    const t = queueTranslations.zhCN;

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
                <MenuItem value={5}>{t.perPage(5)}</MenuItem>
                <MenuItem value={10}>{t.perPage(10)}</MenuItem>
                <MenuItem value={20}>{t.perPage(20)}</MenuItem>
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
                    {t.totalQueues}: {totalQueues}
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
