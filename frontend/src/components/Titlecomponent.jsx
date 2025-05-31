import { Typography } from "@mui/material";

const TitleComponent = ({ text }) => {
    return (
        <Typography
            variant="h4"
            align="center"
            sx={{
                color: "#dc3545",
                letterSpacing: "0.05em",
                fontWeight: 500,
                fontSize: "1.75rem",
                marginBottom: "2rem",
                textTransform: "uppercase",
                position: "relative",
                "&::after": {
                    content: "''",
                    position: "absolute",
                    width: "30%",
                    height: "2px",
                    bottom: "-8px",
                    left: "35%",
                    backgroundColor: "#dc3545",
                    opacity: 0.3,
                },
            }}
        >
            {text}
        </Typography>
    );
};

export default TitleComponent;
