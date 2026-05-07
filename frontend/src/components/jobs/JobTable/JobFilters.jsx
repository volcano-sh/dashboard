import React from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { FilterList } from "@mui/icons-material";
import { useTranslation } from "../../../i18n/I18nProvider";

const JobFilters = ({
    filterType,
    currentValue,
    options,
    handleFilterClick,
    handleFilterClose,
    anchorEl,
}) => {
    const { t, tStatus } = useTranslation();
    const getLabel = (option) =>
        filterType === "status" || option === "All" ? tStatus(option) : option;

    return (
        <>
            <Button
                size="small"
                startIcon={<FilterList fontSize="small" />}
                onClick={(event) => handleFilterClick(filterType, event)}
                sx={{
                    textTransform: "none",
                    padding: "4px 12px",
                    minWidth: "auto",
                    borderRadius: "20px",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    letterSpacing: "0.02em",
                    marginTop: "8px",
                }}
            >
                {t("common.filter")}: {getLabel(currentValue)}
            </Button>
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
                        {getLabel(option)}
                    </MenuItem>
                ))}
            </Menu>
        </>
    );
};

export default JobFilters;
