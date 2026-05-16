import { Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

const JobFilters = ({
    filterType,
    currentValue,
    options,
    handleFilterClick,
    handleFilterClose,
    anchorEl,
}) => {
    const { t } = useTranslation();
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
                    {option === "All"
                        ? t("all")
                        : filterType === "status"
                          ? t(option.toLowerCase())
                          : option}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default JobFilters;
