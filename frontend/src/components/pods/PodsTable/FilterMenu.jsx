import { Menu, MenuItem } from "@mui/material";
import { useTranslation } from "react-i18next";

const FilterMenu = ({ anchorEl, handleClose, items, filterType }) => {
    const { t } = useTranslation();
    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => handleClose(filterType, null)}
        >
            {items.map((item) => (
                <MenuItem key={item} onClick={() => handleClose(filterType, item)}>
                    {item === "All"
                        ? t("all")
                        : filterType === "status"
                            ? t(item.toLowerCase())
                            : item}
                </MenuItem>
            ))}
        </Menu>
    );
};

export default FilterMenu;
