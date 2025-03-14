import React, { useCallback } from 'react';
import { 
    TableContainer, 
    Table, 
    TableHead, 
    TableBody, 
    TableRow, 
    TableCell, 
    Paper, 
    Typography, 
    Box, 
    IconButton, 
    Button, 
    Menu, 
    MenuItem, 
    Chip,
    useTheme,
    alpha
} from '@mui/material';
import { 
    ArrowDownward, 
    ArrowUpward, 
    FilterList, 
    UnfoldMore 
} from '@mui/icons-material';

const QueueTable = ({ 
    sortedQueues, 
    allocatedFields, 
    handleQueueClick, 
    handleSort, 
    sortConfig, 
    filters, 
    handleFilterClick, 
    anchorEl, 
    uniqueStates, 
    handleFilterClose,
    setAnchorEl
}) => {
    const theme = useTheme();

    const getStateColor = useCallback(
        (status) => {
            switch (status) {
                case "Open":
                    return theme.palette.success.main;
                case "Closing":
                    return theme.palette.warning.main;
                case "Closed":
                    return theme.palette.info.main;
                default:
                    return theme.palette.grey[500];
            }
        },
        [theme],
    );

    return (
        <TableContainer
            component={Paper}
            sx={{ 
                maxHeight: "calc(100vh - 200px)", 
                overflow: "auto",
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
                background: `linear-gradient(to bottom, ${alpha(theme.palette.background.paper, 0.9)}, ${theme.palette.background.paper})`,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&::-webkit-scrollbar': {
                    width: '10px',
                    height: '10px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '5px',
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    }
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: '5px',
                }
            }}
        >
            <Table stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell
                            sx={{
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(8px)',
                                padding: "16px 24px",
                                minWidth: 140,
                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <Typography 
                                variant="subtitle1" 
                                fontWeight="700"
                                color="text.primary"
                                sx={{ letterSpacing: '0.02em' }}
                            >
                                Name
                            </Typography>
                        </TableCell>

                        {allocatedFields.map((field) => (
                            <TableCell 
                                key={field}
                                sx={{
                                    backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                    backdropFilter: 'blur(8px)',
                                    padding: "16px 24px",
                                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: '8px'
                                    }}
                                >
                                    <Typography 
                                        variant="subtitle1" 
                                        fontWeight="700"
                                        color="text.primary"
                                        sx={{ letterSpacing: '0.02em' }}
                                    >
                                        {`Allocated ${field}`}
                                    </Typography>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleSort(field)}
                                        sx={{
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            width: '32px',
                                            height: '32px',
                                            '&:hover': {
                                                color: theme.palette.primary.main,
                                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                                transform: 'scale(1.1)',
                                            }
                                        }}
                                    >
                                        {sortConfig.field === field ? (
                                            sortConfig.direction === "asc" ? (
                                                <ArrowUpward fontSize="small" />
                                            ) : (
                                                <ArrowDownward fontSize="small" />
                                            )
                                        ) : (
                                            <UnfoldMore fontSize="small" />
                                        )}
                                    </IconButton>
                                </Box>
                            </TableCell>
                        ))}

                        <TableCell
                            sx={{
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(8px)',
                                padding: "16px 24px",
                                minWidth: 140,
                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <Typography 
                                variant="subtitle1" 
                                fontWeight="700"
                                color="text.primary"
                                sx={{ letterSpacing: '0.02em' }}
                            >
                                Creation Time
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => handleSort("creationTime")}
                                startIcon={
                                    sortConfig.field === "creationTime" ? (
                                        sortConfig.direction === "asc" ? (
                                            <ArrowUpward fontSize="small" />
                                        ) : (
                                            <ArrowDownward fontSize="small" />
                                        )
                                    ) : (
                                        <UnfoldMore fontSize="small" />
                                    )
                                }
                                sx={{
                                    textTransform: "none",
                                    padding: '4px 12px',
                                    minWidth: "auto",
                                    borderRadius: '20px',
                                    marginTop: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                                    }
                                }}
                            >
                                Sort
                            </Button>
                        </TableCell>
                        <TableCell
                            sx={{
                                backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                backdropFilter: 'blur(8px)',
                                padding: "16px 24px",
                                minWidth: 140,
                                borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            }}
                        >
                            <Typography 
                                variant="subtitle1" 
                                fontWeight="700"
                                color="text.primary"
                                sx={{ letterSpacing: '0.02em' }}
                            >
                                State
                            </Typography>
                            <Button
                                size="small"
                                startIcon={<FilterList fontSize="small" />}
                                onClick={(e) => handleFilterClick("status", e)}
                                sx={{
                                    textTransform: "none",
                                    padding: '4px 12px',
                                    minWidth: "auto",
                                    borderRadius: '20px',
                                    marginTop: '8px',
                                    fontSize: '0.8rem',
                                    fontWeight: 500,
                                    letterSpacing: '0.02em',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    backgroundColor: filters.status !== "All" 
                                        ? alpha(theme.palette.primary.main, 0.2)
                                        : alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                    '&:hover': {
                                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                                        transform: 'translateY(-2px)',
                                        boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`,
                                    }
                                }}
                            >
                                Filter: {filters.status}
                            </Button>
                            <Menu
                                anchorEl={anchorEl.status}
                                open={Boolean(anchorEl.status)}
                                onClose={() =>
                                    setAnchorEl((prev) => ({
                                        ...prev,
                                        status: null,
                                    }))
                                }
                                PaperProps={{
                                    elevation: 3,
                                    sx: {
                                        borderRadius: '12px',
                                        mt: 1.5,
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                                        overflow: 'hidden',
                                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                        backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.95)}, ${theme.palette.background.paper})`,
                                        backdropFilter: 'blur(10px)',
                                    }
                                }}
                            >
                                {uniqueStates.map((status) => (
                                    <MenuItem
                                        key={status}
                                        onClick={() =>
                                            handleFilterClose("status", status)
                                        }
                                        sx={{
                                            fontSize: '0.875rem',
                                            minHeight: '40px',
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                                                paddingLeft: '24px',
                                            },
                                            ...(filters.status === status && {
                                                backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                                fontWeight: 600,
                                                '&::before': {
                                                    content: '""',
                                                    position: 'absolute',
                                                    left: '0',
                                                    top: '0',
                                                    bottom: '0',
                                                    width: '3px',
                                                    backgroundColor: theme.palette.primary.main,
                                                }
                                            })
                                        }}
                                    >
                                        {status}
                                    </MenuItem>
                                ))}
                            </Menu>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {sortedQueues.map((queue) => (
                        <TableRow
                            hover
                            key={queue.metadata.name}
                            onClick={() => handleQueueClick(queue)}
                            sx={{
                                height: '60px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

                                "&:hover": {
                                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                                    '& .MuiTableCell-root': {
                                        color: theme.palette.primary.main,
                                    },
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    transform: 'translateY(-2px) scale(1.005)',
                                },
                                cursor: "pointer",
                                '&:last-child td, &:last-child th': {
                                    borderBottom: 0,
                                },
                                '& td': {
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                                }
                            }}
                        >
                            <TableCell sx={{ 
                                padding: '16px 24px', 
                                fontWeight: 600,
                                color: theme.palette.text.primary,
                                letterSpacing: '0.01em',
                            }}>
                                {queue.metadata.name}
                            </TableCell>
                            
                            {allocatedFields.map((field) => (
                                <TableCell 
                                    key={field}
                                    sx={{ 
                                        padding: '16px 24px',
                                        fontFamily: theme.typography.fontFamily,
                                        fontVariantNumeric: 'tabular-nums',
                                        fontSize: '0.95rem',
                                        fontWeight: 500,
                                    }}
                                >
                                    {queue.status?.allocated?.[field] || "0"}
                                </TableCell>
                            ))}
                            
                            <TableCell sx={{ 
                                padding: '16px 24px',
                                fontSize: '0.9rem',
                                color: alpha(theme.palette.text.primary, 0.85),
                            }}>
                                {new Date(
                                    queue.metadata.creationTimestamp,
                                ).toLocaleString()}
                            </TableCell>
                            
                            <TableCell sx={{ padding: '16px 24px' }}>
                                <Chip
                                    label={
                                        queue.status
                                            ? queue.status.state
                                            : "Unknown"
                                    }
                                    sx={{
                                        bgcolor: getStateColor(
                                            queue.status
                                                ? queue.status.state
                                                : "Unknown",
                                        ),
                                        color: "common.white",
                                        height: '30px',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        letterSpacing: '0.02em',
                                        borderRadius: '15px',
                                        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
                                        padding: '0 12px',
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2)',
                                            filter: 'brightness(1.05)',
                                        }
                                    }}
                                />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default QueueTable;