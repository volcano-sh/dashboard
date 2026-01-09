import React from "react";
import PropTypes from "prop-types";
import { Menu, MenuItem } from "@mui/material";

const JobFilters = ({
    filterType,
    currentValue,
    options = [],
    handleFilterClick,
    handleFilterClose,
    anchorEl,
}) => {
    const safeOptions = Array.isArray(options) ? options : [];

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleFilterClose}
        >
            {safeOptions.map((option) => (
                <MenuItem
                    key={option}
                    selected={option === currentValue}
                    onClick={() => handleFilterClick(filterType, option)}
                >
                    {option}
                </MenuItem>
            ))}
        </Menu>
    );
};

JobFilters.propTypes = {
    filterType: PropTypes.string.isRequired,
    currentValue: PropTypes.string,
    options: PropTypes.arrayOf(PropTypes.string),
    handleFilterClick: PropTypes.func.isRequired,
    handleFilterClose: PropTypes.func.isRequired,
    anchorEl: PropTypes.object,
};

JobFilters.defaultProps = {
    options: [],
    currentValue: "",
};

export default JobFilters;