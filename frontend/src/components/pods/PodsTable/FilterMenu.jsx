import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { useTranslation } from "../../../i18n/I18nProvider";

const FilterMenu = ({
    anchorEl,
    handleClose,
    items,
    filterType,
    currentValue,
}) => {
    const { tStatus } = useTranslation();
    const getLabel = (item) =>
        filterType === "status" || item === "All" ? tStatus(item) : item;

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleClose(filterType, currentValue)}
        >
            {items.map((item) => (
                <MenuItem
                    key={item}
                    onClick={() => handleClose(filterType, item)}
                >
                    {getLabel(item)}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default FilterMenu;
