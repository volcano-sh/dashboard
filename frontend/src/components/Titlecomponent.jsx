import { Typography } from "@mui/material";
import { useTranslation } from "../i18n/I18nProvider";

const TitleComponent = ({ text }) => {
    const { t, language } = useTranslation();

    return (
        <Typography
            variant="h4"
            align="center"
            className="text-center rounded mx-auto"
            sx={{
                color: "#dc3545",
                letterSpacing: "1px",
                textTransform: language === "zh" ? "none" : "uppercase",
                maxWidth: "80%",
                position: "relative",
                "&::after": {
                    content: "''",
                    position: "absolute",
                    width: "30%",
                    height: "3px",
                    bottom: "-3px",
                    left: "35%",
                },
            }}
        >
            {t(text)}
        </Typography>
    );
};

export default TitleComponent;
