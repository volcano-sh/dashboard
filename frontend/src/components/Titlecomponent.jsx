import { Typography } from "@mui/material";

const TitleComponent = ({ text }) => {
    return (
        <Typography
            variant="h4"
            align="center"
            className="fw-bold d-block text-center w-100 py-3 mb-4 border-bottom border-top rounded mx-auto"
            sx={{
                color: "#dc3545",
                letterSpacing: "1px",
                textTransform: "uppercase",
                maxWidth: "80%",
                boxShadow: "0 4px 6px rgba(220, 53, 69, 0.1)",
                position: "relative",
                "&::after": {
                    content: "''",
                    position: "absolute",
                    width: "30%",
                    height: "3px",
                    backgroundColor: "#dc3545",
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
