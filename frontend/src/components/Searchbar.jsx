// SearchBar.js
import React, { useState } from "react";
import {
    Box,
    Paper,
    InputBase,
    IconButton,
    Button,
    useTheme,
    alpha,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import RefreshIcon from "@mui/icons-material/Refresh";
import CreateDialog from "./CreateDialog";
import CreateJobDialog from "./jobs/JobTable/CreateJobDialog";
import PropTypes from "prop-types";

const SearchBar = ({
    searchText,
    handleSearch,
    handleClearSearch,
    handleRefresh,
    fetchData,
    isRefreshing,
    dialogTitle,
    dialogResourceNameLabel,
    dialogResourceType,
    placeholder,
    refreshLabel,
    onCreateClick,
    createlabel,
}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const theme = useTheme();

    const handleOpenDialog = () => setDialogOpen(true);
    const handleCloseDialog = () => setDialogOpen(false);

    const handleDialogCreate = async (resourceData) => {
        if (onCreateClick) {
            await onCreateClick(resourceData);
        }
        setDialogOpen(false);
    };

    return (
        <>
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    mb: 3,
                    backgroundColor: "transparent",
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "stretch", md: "center" },
                    gap: 2,
                    justifyContent: "space-between",
                }}
            >
                <Paper
                    elevation={1}
                    sx={{
                        p: "2px 4px",
                        display: "flex",
                        alignItems: "center",
                        width: { xs: "100%", md: 300 },
                        borderRadius: "24px",
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? alpha(theme.palette.background.paper, 0.15)
                                : theme.palette.background.paper,
                    }}
                >
                    <IconButton
                        sx={{ p: "10px", color: theme.palette.primary.main }}
                        aria-label="search"
                        onClick={() => fetchData()}
                        disabled={isRefreshing}
                    >
                        <SearchIcon />
                    </IconButton>
                    <InputBase
                        sx={{
                            ml: 1,
                            flex: 1,
                            color: theme.palette.text.primary,
                        }}
                        placeholder={placeholder}
                        value={searchText}
                        onChange={handleSearch}
                    />
                    {searchText && (
                        <IconButton
                            sx={{
                                p: "10px",
                                color: theme.palette.text.secondary,
                            }}
                            aria-label="clear search"
                            onClick={handleClearSearch}
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </Paper>

                <Box
                    sx={{
                        display: "flex",
                        gap: 2,
                        justifyContent: { xs: "flex-end", md: "flex-end" },
                    }}
                >
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={
                            <RefreshIcon
                                className={isRefreshing ? "spin" : ""}
                            />
                        }
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        sx={{
                            borderRadius: "24px",
                            px: 3,
                            backgroundColor: theme.palette.primary.main,
                            color: theme.palette.primary.contrastText,
                            "&:hover": {
                                backgroundColor: theme.palette.primary.dark,
                            },
                            "& .spin": {
                                animation: "spin 1s linear infinite",
                            },
                            "@keyframes spin": {
                                "0%": {
                                    transform: "rotate(0deg)",
                                },
                                "100%": {
                                    transform: "rotate(360deg)",
                                },
                            },
                        }}
                    >
                        {isRefreshing ? "Refreshing..." : refreshLabel}
                    </Button>

                    <Button
                        variant="outline-danger"
                        size="sm"
                        className="rounded-pill px-4 py-2 d-flex align-items-center justify-content-center shadow-sm fw-medium border-2"
                        onClick={handleOpenDialog}
                        style={{
                            backgroundColor: "#E34C26",
                            color: "white",
                            transition: "all 0.3s ease",
                            height: "35px",
                        }}
                        >
                            <span>{createlabel}</span>
                                </Button>
                </Box>
            </Paper>

            {dialogResourceType === "Queue" && (
                <CreateDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    onCreate={handleDialogCreate}
                    title={dialogTitle}
                    resourceNameLabel={dialogResourceNameLabel}
                    resourceType={dialogResourceType}
                />
            )}

            {dialogResourceType === "Job" && (
                <CreateJobDialog
                    open={dialogOpen}
                    onClose={handleCloseDialog}
                    onCreate={handleDialogCreate}
                    title={dialogTitle}
                    resourceNameLabel={dialogResourceNameLabel}
                    resourceType={dialogResourceType}
                />
            )}
        </>
    );
};

export default SearchBar;
