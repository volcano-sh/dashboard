import React from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import { Menu, MenuItem } from "@mui/material";

const JobFilters = ({
    filterType,
    currentValue,
    options,
    handleFilterClick,
    handleFilterClose,
    anchorEl,
}) => {
    const { lang } = useLanguage();
    const zh = lang === "zh";
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
                    {zh ? ({"All": "全部", "Running": "运行中", "Pending": "等待中", "Failed": "失败", "Completed": "已完成", "Succeeded": "成功"}[option] || option) : option}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default JobFilters;
