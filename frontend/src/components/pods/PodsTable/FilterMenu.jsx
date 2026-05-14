import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

const FilterMenu = ({ anchorEl, handleClose, items, filterType }) => {
    const { t } = useTranslation();

    const translateItem = (item) => {
        if (!item) return item;
        const key = `status.${item.toLowerCase()}`;
        const translated = t(key);
        // If the key resolves back to the raw key path, fall back to the original
        return translated === key ? item : translated;
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleClose(filterType, null)}
        >
            {items.map((item) => (
                <MenuItem key={item} onClick={() => handleClose(filterType, item)}>
                    {translateItem(item)}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default FilterMenu;
