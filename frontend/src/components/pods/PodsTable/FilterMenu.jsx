import React from "react";
import { Menu, MenuItem } from "@mui/material";

const STATUS_LABELS_TO_VALUES = {
    全部: "All",
    运行中: "Running",
    等待中: "Pending",
    已成功: "Succeeded",
    已失败: "Failed",
};

const FilterMenu = ({ anchorEl, handleClose, items, filterType }) => {
    const onMenuItemClick = (item) => {
        const value =
            filterType === "status" && STATUS_LABELS_TO_VALUES[item]
                ? STATUS_LABELS_TO_VALUES[item]
                : item;
        handleClose(filterType, value);
    };

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleClose(filterType, null)}
        >
            {items.map((item) => (
                <MenuItem key={item} onClick={() => onMenuItemClick(item)}>
                    {item}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default FilterMenu;
