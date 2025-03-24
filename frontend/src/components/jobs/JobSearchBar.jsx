import React from "react";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { Clear, Search } from "@mui/icons-material";

const JobSearchBar = ({
    searchText,
    setSearchText,
    handleSearch,
    handleClearSearch,
    fetchJobs,
}) => {
    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
                placeholder="Search jobs"
                variant="outlined"
                size="small"
                value={searchText}
                onChange={handleSearch}
                sx={{ width: 200 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <IconButton
                                size="small"
                                onClick={() => fetchJobs()}
                                sx={{ padding: "4px" }}
                            >
                                <Search />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: searchText && (
                        <IconButton
                            size="small"
                            onClick={handleClearSearch}
                            sx={{ padding: "4px" }}
                        >
                            <Clear />
                        </IconButton>
                    ),
                }}
            />
        </Box>
    );
};

export default JobSearchBar;
