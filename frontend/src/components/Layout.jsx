import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Tooltip,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import CategoryIcon from "@mui/icons-material/Category";

// use relative path to load Logo
import volcanoLogo from "../assets/volcano-icon-color.svg";
import { useTranslation } from "../i18n/I18nProvider";

const Layout = () => {
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const { language, setLanguage, t } = useTranslation();

    // constants can be kept outside the component
    const volcanoOrange = "#E34C26"; // orange red theme
    const headerGrey = "#424242"; // dark gray top stripe
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const menuItems = [
        { key: "dashboard", icon: <HomeIcon />, path: "/dashboard" },
        { key: "jobs", icon: <AssignmentIcon />, path: "/jobs" },
        { key: "queues", icon: <CloudIcon />, path: "/queues" },
        { key: "pods", icon: <WorkspacesIcon />, path: "/pods" },
        { key: "podgroups", icon: <CategoryIcon />, path: "/podgroups" },
    ];

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: headerGrey,
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        aria-label={t("nav.toggleDrawer")}
                        onClick={handleDrawerToggle}
                        edge="start"
                        sx={{ mr: 2, color: "white" }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={{
                            color: "#ffffff",
                            fontWeight: 500,
                        }}
                    >
                        {t("app.name")}
                    </Typography>
                    <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                        <Typography
                            variant="body2"
                            sx={{ color: "#ffffff", alignSelf: "center" }}
                        >
                            {t("language.switcher")}
                        </Typography>
                        <ToggleButtonGroup
                            size="small"
                            value={language}
                            exclusive
                            onChange={(_, nextLanguage) => {
                                if (nextLanguage) {
                                    setLanguage(nextLanguage);
                                }
                            }}
                            sx={{
                                "& .MuiToggleButton-root": {
                                    color: "#ffffff",
                                    borderColor: "rgba(255,255,255,0.25)",
                                    textTransform: "none",
                                    px: 1.5,
                                },
                                "& .Mui-selected": {
                                    bgcolor: "#E34C26 !important",
                                    color: "#ffffff !important",
                                },
                            }}
                        >
                            <ToggleButton value="en">
                                {t("language.english")}
                            </ToggleButton>
                            <ToggleButton value="zh">
                                {t("language.chinese")}
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </Box>
                </Toolbar>
            </AppBar>

            <Drawer
                data-testid="sidebar-drawer"
                variant="permanent"
                sx={{
                    width: open ? drawerWidth : 60,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: open ? drawerWidth : 60,
                        boxSizing: "border-box",
                        backgroundColor: "#f5f5f5",
                        transition: "width 0.2s",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column",
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: "hidden auto", flexGrow: 1 }}>
                    <List>
                        {menuItems.map((item) => {
                            const label = t(`nav.${item.key}`);
                            const listItem = (
                                <ListItem
                                    key={item.key}
                                    component={Link}
                                    to={item.path}
                                    className={
                                        location.pathname === item.path
                                            ? "active"
                                            : ""
                                    }
                                    sx={{
                                        "&.active": {
                                            bgcolor: "rgba(0, 0, 0, 0.08)",
                                            "& .MuiListItemIcon-root": {
                                                color: volcanoOrange,
                                            },
                                            "& .MuiListItemText-primary": {
                                                color: volcanoOrange,
                                                fontWeight: 500,
                                            },
                                        },
                                        "&:hover": {
                                            backgroundColor:
                                                "rgba(0, 0, 0, 0.1)",
                                        },
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    {open && <ListItemText primary={label} />}
                                </ListItem>
                            );
                            return !open ? (
                                <Tooltip
                                    key={item.key}
                                    title={label}
                                    placement="right"
                                >
                                    {listItem}
                                </Tooltip>
                            ) : (
                                <React.Fragment key={item.key}>
                                    {listItem}
                                </React.Fragment>
                            );
                        })}
                    </List>
                </Box>
                {/* Logo and text part */}
                <Box
                    sx={{
                        p: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        mt: "auto",
                        mb: 1,
                        // borderTop: "1px solid rgba(0, 0, 0, 0.12)",
                    }}
                >
                    <img
                        src={volcanoLogo}
                        alt={`${t("app.name")} Logo`}
                        style={{
                            maxWidth: open ? "150px" : "60px",
                            height: "auto",
                            transition: "max-width 0.2s",
                            marginBottom: "1px",
                        }}
                    />
                    {/* {open && (
            <Typography
              sx={{
                fontWeight: 700,
                color: "#000",
                fontSize: "1.4rem",
                letterSpacing: "0.1em",
                mt: -6,
              }}
            >
              VOLCANO
            </Typography>
          )} */}
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{ flexGrow: 1, p: 3, backgroundColor: "white" }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
