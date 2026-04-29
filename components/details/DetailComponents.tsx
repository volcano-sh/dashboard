import React from "react";
import {
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import { detailPanelBorder } from "./ResourceDetailDrawer";

type DetailCardProps = {
    children: React.ReactNode;
    title: React.ReactNode;
};

type DetailRowProps = {
    label: React.ReactNode;
    value?: React.ReactNode;
    valueNode?: React.ReactNode;
};

export const detailLabelSx = {
    color: "text.secondary",
    fontSize: 12,
    fontWeight: 700,
};

export const detailValueSx = {
    color: "text.primary",
    fontFamily:
        '"Roboto Mono", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 12.5,
};

export const DetailCard = ({ children, title }: DetailCardProps) => (
    <Box
        sx={{
            bgcolor: "#ffffff",
            border: `1px solid ${detailPanelBorder}`,
            borderRadius: 1,
            boxShadow: "none",
            p: 2,
        }}
    >
        <Typography sx={{ fontSize: 14, fontWeight: 700, mb: 1.25 }}>
            {title}
        </Typography>
        {children}
    </Box>
);

export const DetailRow = ({ label, value, valueNode }: DetailRowProps) => (
    <Box
        sx={{
            alignItems: "flex-start",
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: "140px minmax(0, 1fr)",
            py: 0.55,
        }}
    >
        <Typography sx={detailLabelSx}>{label}</Typography>
        {valueNode || (
            <Typography sx={detailValueSx}>{value || "-"}</Typography>
        )}
    </Box>
);

export const MetadataChips = ({ items }) => {
    const entries = Object.entries(items || {});
    if (!entries.length) {
        return <Typography sx={detailValueSx}>-</Typography>;
    }

    return (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {entries.slice(0, 8).map(([key, value]) => (
                <Chip
                    key={key}
                    label={`${key}=${value}`}
                    size="small"
                    sx={{
                        bgcolor: "#ffffff",
                        border: `1px solid ${detailPanelBorder}`,
                        fontSize: 11.5,
                        height: 24,
                    }}
                />
            ))}
            {entries.length > 8 && (
                <Chip label={`+${entries.length - 8}`} size="small" />
            )}
        </Box>
    );
};

export const EventsTable = ({ events }) => (
    <Table size="small">
        <TableHead>
            <TableRow>
                <TableCell sx={{ bgcolor: "#f7f8fa", fontWeight: 700 }}>
                    Type
                </TableCell>
                <TableCell sx={{ bgcolor: "#f7f8fa", fontWeight: 700 }}>
                    Reason
                </TableCell>
                <TableCell sx={{ bgcolor: "#f7f8fa", fontWeight: 700 }}>
                    Message
                </TableCell>
                <TableCell sx={{ bgcolor: "#f7f8fa", fontWeight: 700 }}>
                    Count
                </TableCell>
                <TableCell sx={{ bgcolor: "#f7f8fa", fontWeight: 700 }}>
                    Last Seen
                </TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {(events || []).length === 0 ? (
                <TableRow>
                    <TableCell
                        align="center"
                        colSpan={5}
                        sx={{ color: "text.secondary", py: 4 }}
                    >
                        No events available.
                    </TableCell>
                </TableRow>
            ) : (
                events.map((event) => (
                    <TableRow key={event.uid || event.name || event.message}>
                        <TableCell>{event.type}</TableCell>
                        <TableCell>{event.reason}</TableCell>
                        <TableCell>{event.message}</TableCell>
                        <TableCell>{event.count}</TableCell>
                        <TableCell>{event.lastTimestamp || "-"}</TableCell>
                    </TableRow>
                ))
            )}
        </TableBody>
    </Table>
);
