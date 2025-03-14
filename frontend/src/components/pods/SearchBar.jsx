import React from "react";
import { Box, IconButton, InputAdornment, TextField } from "@mui/material";
import { Clear, Search } from "@mui/icons-material";

const SearchBar = ({ searchText, onSearch, onClear, onSearchSubmit }) => {
    const handleSearch = (event) => {
        onSearch(event.target.value);
    };

    return (
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
                placeholder="Search pods"
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
                                onClick={onSearchSubmit}
                                sx={{ padding: "4px" }}
                            >
                                <Search />
                            </IconButton>
                        </InputAdornment>
                    ),
                    endAdornment: searchText && (
                        <IconButton
                            size="small"
                            onClick={onClear}
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

export default SearchBar;