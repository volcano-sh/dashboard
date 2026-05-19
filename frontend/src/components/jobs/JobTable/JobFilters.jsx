import React from "react";
import { Menu, MenuItem } from "@mui/material";
import { translations } from "../../../config/translations";

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
            onClose={() => handleFilterClose(filterType, currentValue)}
        >
            {(options || []).length === 0 ? (
                <MenuItem disabled>
                    {translations.zh.noData || "暂无数据"}
                </MenuItem>
            ) : (
                (options || []).map((option) => {
                    let display = "";
                    if (typeof option === "string") {
                        if (filterType === "status") {
                            if (option === "All") {
                                display = translations.zh.all;
                            } else {
                                const key = option.toLowerCase();
                                display = (translations.zh[key] || option) || "";
                            }
                        } else if (filterType === "namespace") {
                            if (option === "All") {
                                display = translations.zh.all;
                            } else if (option === "default") {
                                display = translations.zh.default;
                            } else {
                                display = option;
                            }
                        } else {
                            display = option;
                        }
                    }
                    return (
                        <MenuItem
                            key={String(option)}
                            selected={option === currentValue}
                            onClick={() => handleFilterClose(filterType, option)}
                        >
                            {display}
                        </MenuItem>
                    );
                })
            )}
        </Menu>
    );
};

export default JobFilters;
