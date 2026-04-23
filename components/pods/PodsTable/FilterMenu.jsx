import React from "react";
import { Menu, MenuItem } from "@mui/material";

const FilterMenu = ({ anchorEl, handleClose, items, filterType }) => (
    <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(filterType, null)}
    >
        {items.map((item) => (
            <MenuItem key={item} onClick={() => handleClose(filterType, item)}>
                {item}
            </MenuItem>
        ))}
    </Menu>
);

export default FilterMenu;
