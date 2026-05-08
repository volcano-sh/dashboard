import React from "react";
import { Menu, MenuItem } from "@mui/material";

const TableFilterMenu = ({
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
            onClose={() => handleFilterClose(filterType, currentValue)}
        >
            {options.map((option) => (
                <MenuItem
                    key={option}
                    selected={option === currentValue}
                    onClick={() => handleFilterClose(filterType, option)}
                >
                    {option}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default TableFilterMenu;
