import React from "react";
import { useTranslation } from "react-i18next";
import { Box, MenuItem, Pagination, Select, Typography } from "@mui/material";

const PodsPagination = ({ totalPods, pagination, onPaginationChange }) => {
    const { t } = useTranslation();

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
                justifyContent: "space-between",
                alignItems: "center",
            }}
        >
            <Select
                value={pagination.rowsPerPage}
                onChange={handleChangeRowsPerPage}
                size="small"
            >
                <MenuItem value={5}>{t("pods.pagination.perPage", { count: 5 })}</MenuItem>
                <MenuItem value={10}>{t("pods.pagination.perPage", { count: 10 })}</MenuItem>
                <MenuItem value={20}>{t("pods.pagination.perPage", { count: 20 })}</MenuItem>
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
                    {t("pods.pagination.totalPods", { count: totalPods })}
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
