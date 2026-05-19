import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { translations } from "../../../config/translations";

const FilterMenu = ({ anchorEl, handleClose, items, filterType }) => (
    <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose(filterType, null)}
    >
        {items.map((item) => {
            let display = item;
            if (filterType === "status") {
                if (item === "All") display = translations.zh.all;
                else display = translations.zh[item.toLowerCase()] || item;
            } else if (filterType === "namespace") {
                if (item === "default") display = translations.zh.default;
                else display = item;
            }

            return (
                <MenuItem key={item} onClick={() => handleClose(filterType, item)}>
                    {display}
                </MenuItem>
            );
        })}
    </Menu>
);

export default FilterMenu;
