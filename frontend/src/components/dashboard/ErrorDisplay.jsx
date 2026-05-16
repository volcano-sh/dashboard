import { Paper, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

const ErrorDisplay = ({ message, errorKey }) => {
    const { t } = useTranslation();
    return (
        <Paper
            sx={{
                p: 2,
                mb: 2,
                bgcolor: "error.light",
                color: "error.contrastText",
            }}
        >
            <Typography>
                {errorKey ? `${t(errorKey)} ${message}` : message}
            </Typography>
        </Paper>
    );
};

export default ErrorDisplay;
