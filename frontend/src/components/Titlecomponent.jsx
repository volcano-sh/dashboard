import { Typography } from "@mui/material";

const TitleComponent = ({ text }) => {
    return (
        <Typography
            variant="h4"
            align="center"
            className="text-center rounded mx-auto"
            sx={{
                color: "#dc3545",
                letterSpacing: "1px",
                textTransform: "uppercase",
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
            {text}
        </Typography>
    );
};

export default TitleComponent;
