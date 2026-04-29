import React from "react";
import {
    TableHead,
    TableRow,
    TableCell,
    Typography,
    useTheme,
    IconButton,
    Box,
} from "@mui/material";
import { ArrowDownward, ArrowUpward, UnfoldMore } from "@mui/icons-material";

const TableHeader = ({ onSortDirectionToggle, sortDirection }) => {
    const theme = useTheme();

    return (
        <TableHead>
            <TableRow>
                {[
                    "Name",
                    "Namespace",
                    "Queue",
                    "Creation Time",
                    "Status",
                    "Age",
                ].map((header) => (
                    <TableCell
                        key={header}
                        sx={{
                            backgroundColor: "#fafbfc",
                            padding: "12px 18px",
                            minWidth: 140,
                            borderBottom: `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 0.75,
                            }}
                        >
                            <Typography
                                color="text.primary"
                                sx={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    letterSpacing: "0.01em",
                                }}
                            >
                                {header}
                            </Typography>
                            {header === "Creation Time" && (
                                <IconButton
                                    onClick={onSortDirectionToggle}
                                    size="small"
                                    sx={{
                                        color: "text.secondary",
                                        height: 24,
                                        width: 24,
                                    }}
                                >
                                    {sortDirection === "desc" ? (
                                        <ArrowDownward fontSize="inherit" />
                                    ) : sortDirection === "asc" ? (
                                        <ArrowUpward fontSize="inherit" />
                                    ) : (
                                        <UnfoldMore fontSize="inherit" />
                                    )}
                                </IconButton>
                            )}
                        </Box>
                    </TableCell>
                ))}
            </TableRow>
        </TableHead>
    );
};

export default TableHeader;
