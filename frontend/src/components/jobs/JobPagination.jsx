import { Box, MenuItem, Pagination, Select, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const JobPagination = ({
    pagination,
    totalJobs,
    handleChangePage,
    handleChangeRowsPerPage,
    totalLabel,
    totalKey,
}) => {
    const { t } = useTranslation();
    const displayTotalLabel = totalKey
        ? t(`${totalKey}_count`, { count: totalJobs })
        : totalLabel
          ? `${totalLabel}: ${totalJobs}`
          : t("total_jobs_count", { count: totalJobs });
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
                <MenuItem value={5}>{t("items_per_page", { count: 5 })}</MenuItem>
                <MenuItem value={10}>{t("items_per_page", { count: 10 })}</MenuItem>
                <MenuItem value={20}>{t("items_per_page", { count: 20 })}</MenuItem>
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
                    {displayTotalLabel}
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
