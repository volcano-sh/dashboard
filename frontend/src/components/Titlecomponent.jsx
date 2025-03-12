import { Typography } from "@mui/material";

const TitleComponent = ({ text }) => {
    return (
        <Typography
            variant="h4"
            sx={{
                fontWeight: "bold",
                background: "linear-gradient(45deg, #dc3545, #ff5722)",
                WebkitBackgroundClip: "text",
                color: "transparent",
                textAlign: "center",
                display: "block",
                fontSize: "3rem",
            }}
        >
            {text}
        </Typography>
    );
};

export default TitleComponent;
