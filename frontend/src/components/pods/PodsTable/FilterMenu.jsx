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
                {{
                    All: "全部",
                    Running: "运行中",
                    Pending: "等待中",
                    Succeeded: "成功",
                    Failed: "失败",
                }[item] || item}
            </MenuItem>
        ))}
    </Menu>
);

export default FilterMenu;
