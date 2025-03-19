import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FilterList } from "@mui/icons-material";

const JobFilters = ({
    filterType,
    currentValue,
    options,
    handleFilterClick,
    handleFilterClose,
    anchorEl,
}) => {
    return (
        <>
            <Button
                size="small"
                startIcon={<FilterList />}
                onClick={(e) => handleFilterClick(filterType, e)}
                sx={{
                    textTransform: "none",
                    padding: 0,
                    minWidth: "auto",
                }}
            >
                Filter: {currentValue}
            </Button>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => handleFilterClose(filterType, currentValue)}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option}
                        onClick={() => handleFilterClose(filterType, option)}
                        selected={option === currentValue}
                    >
                        {option}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default JobFilters;
