import React from "react";
import { Paper, TableContainer } from "@mui/material";

const scrollbarSx = {
    "&::-webkit-scrollbar": {
        height: "10px",
        width: "10px",
    },
    "&::-webkit-scrollbar-thumb": {
        backgroundColor: "#d7dce1",
        borderRadius: "5px",
        "&:hover": {
            backgroundColor: "#c2c8cf",
        },
    },
    "&::-webkit-scrollbar-track": {
        backgroundColor: "#f3f4f6",
        borderRadius: "5px",
    },
};

const SchedulingTableSurface = ({ children, maxHeight = "calc(100vh - 200px)" }) => (
    <TableContainer
        component={Paper}
        sx={{
            border: "1px solid #dfe3e8",
            borderRadius: 1.5,
            boxShadow: "none",
            maxHeight,
            overflow: "auto",
            ...scrollbarSx,
        }}
    >
        {children}
    </TableContainer>
);

export default SchedulingTableSurface;
