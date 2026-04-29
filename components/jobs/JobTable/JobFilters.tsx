import React from "react";
import { Menu, MenuItem } from "@mui/material";

const JobFilters = ({
    filterType,
    currentValue,
    options,
    handleFilterClick,
    handleFilterClose,
    anchorEl,
}) => {
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterClose}
        >
            {options.map((option) => (
                <MenuItem
                    key={option}
                    selected={option === currentValue}
                    onClick={() => handleFilterClick(filterType, option)}
                >
                    {option}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default JobFilters;
