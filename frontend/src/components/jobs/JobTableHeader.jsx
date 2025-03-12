import React from "react";
import { TableCell, Typography, Button, useTheme } from "@mui/material";
import { ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";

const JobTableHeader = ({ sortDirection, setSortDirection }) => {
    const theme = useTheme();

    const toggleSortDirection = () => {
        setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    };

    return (
        <>
            <TableCell
                sx={{
                    backgroundColor: "background.paper",
                    padding: "8px 16px",
                    minWidth: 120,
                }}
            >
                <Typography variant="h6">Name</Typography>
            </TableCell>
            <TableCell
                sx={{
                    backgroundColor: "background.paper",
                    padding: "8px 16px",
                    minWidth: 120,
                }}
            >
                <Typography variant="h6">Namespace</Typography>
            </TableCell>
            <TableCell
                sx={{
                    backgroundColor: "background.paper",
                    padding: "8px 16px",
                    minWidth: 120,
                }}
            >
                <Typography variant="h6">Queue</Typography>
            </TableCell>
            <TableCell
                sx={{
                    backgroundColor: "background.paper",
                    padding: "8px 16px",
                    minWidth: 120,
                }}
            >
                <Typography variant="h6">Creation Time</Typography>
                <Button
                    size="small"
                    onClick={toggleSortDirection}
                    startIcon={
                        sortDirection === "desc" ? (
                            <ArrowDownward />
                        ) : sortDirection === "asc" ? (
                            <ArrowUpward />
                        ) : (
                            <UnfoldMore />
                        )
                    }
                    sx={{
                        textTransform: "none",
                        padding: 0,
                        minWidth: "auto",
                    }}
                >
                    Sort
                </Button>
            </TableCell>
            <TableCell
                sx={{
                    backgroundColor: "background.paper",
                    padding: "8px 16px",
                    minWidth: 120,
                }}
            >
                <Typography variant="h6">Status</Typography>
            </TableCell>
        </>
    );
};

export default JobTableHeader;
