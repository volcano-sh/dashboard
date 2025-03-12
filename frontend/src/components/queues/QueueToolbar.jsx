import React from 'react';
import { 
    Box, 
    Button, 
    TextField, 
    IconButton, 
    InputAdornment 
} from '@mui/material';
import { Clear, Refresh, Search } from '@mui/icons-material';

const QueueToolbar = ({ 
    searchText, 
    handleSearch, 
    handleClearSearch, 
    handleRefresh, 
    fetchQueues 
}) => {
    return (
        <Box
            sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: 2,
            }}
        >
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <TextField
                    placeholder="Search queues"
                    variant="outlined"
                    size="small"
                    value={searchText}
                    sx={{ width: 200 }}
                    onChange={handleSearch}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <IconButton
                                    size="small"
                                    onClick={() => fetchQueues()}
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

            <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={handleRefresh}
            >
                Refresh Queue Status
            </Button>
        </Box>
    );
};

export default QueueToolbar;