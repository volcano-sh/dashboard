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
    Menu,
    MenuItem,
    Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import CategoryIcon from "@mui/icons-material/Category";
import TranslateIcon from "@mui/icons-material/Translate";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";

import { useI18n } from "../context/I18nContext";

// use relative path to load Logo
import volcanoLogo from "../assets/volcano-icon-color.svg";

const Layout = () => {
    // Hooks must be used inside component functions
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const { locale, setLocale, t } = useI18n();
    const [langAnchorEl, setLangAnchorEl] = useState(null);

    // constants can be kept outside the component
    const volcanoOrange = "#E34C26"; // orange red theme
    const headerGrey = "#424242"; // dark gray top stripe
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleLangClick = (event) => {
        setLangAnchorEl(event.currentTarget);
    };

    const handleLangClose = (newLocale) => {
        setLangAnchorEl(null);
        if (newLocale === "en" || newLocale === "zh") {
            setLocale(newLocale);
        }
    };

    const menuItems = [
        {
            text: t("sidebar.dashboard"),
            icon: <HomeIcon />,
            path: "/dashboard",
            key: "dashboard",
        },
        {
            text: t("sidebar.jobs"),
            icon: <AssignmentIcon />,
            path: "/jobs",
            key: "jobs",
        },
        {
            text: t("sidebar.queues"),
            icon: <CloudIcon />,
            path: "/queues",
            key: "queues",
        },
        {
            text: t("sidebar.pods"),
            icon: <WorkspacesIcon />,
            path: "/pods",
            key: "pods",
        },
        {
            text: t("sidebar.podgroups"),
            icon: <CategoryIcon />,
            path: "/podgroups",
            key: "podgroups",
        },
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
                        aria-label="toggle drawer"
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
                            flexGrow: 1,
                        }}
                    >
                        {t("dashboard.title")}
                    </Typography>

                    {/* Language Dropdown Selector */}
                    <Box sx={{ ml: "auto" }}>
                        <Button
                            color="inherit"
                            onClick={handleLangClick}
                            startIcon={<TranslateIcon />}
                            endIcon={<KeyboardArrowDownIcon />}
                            sx={{
                                color: "#ffffff",
                                textTransform: "none",
                                borderRadius: "20px",
                                px: 2,
                                py: 0.5,
                                fontSize: "0.9rem",
                                fontWeight: 500,
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                "&:hover": {
                                    backgroundColor:
                                        "rgba(255, 255, 255, 0.15)",
                                },
                            }}
                        >
                            {locale === "en" ? "English" : "简体中文"}
                        </Button>
                        <Menu
                            anchorEl={langAnchorEl}
                            open={Boolean(langAnchorEl)}
                            onClose={() => handleLangClose()}
                            PaperProps={{
                                sx: {
                                    mt: 1,
                                    borderRadius: "12px",
                                    boxShadow: "0px 10px 25px rgba(0,0,0,0.1)",
                                    border: "1px solid rgba(0,0,0,0.06)",
                                    "& .MuiMenuItem-root": {
                                        fontSize: "0.9rem",
                                        py: 1,
                                        px: 2,
                                        borderRadius: "6px",
                                        mx: 0.5,
                                        my: 0.2,
                                        fontWeight: 500,
                                        "&.Mui-selected": {
                                            backgroundColor:
                                                "rgba(227, 76, 38, 0.08)",
                                            color: "#E34C26",
                                            "&:hover": {
                                                backgroundColor:
                                                    "rgba(227, 76, 38, 0.12)",
                                            },
                                        },
                                    },
                                },
                            }}
                        >
                            <MenuItem
                                selected={locale === "en"}
                                onClick={() => handleLangClose("en")}
                            >
                                English
                            </MenuItem>
                            <MenuItem
                                selected={locale === "zh"}
                                onClick={() => handleLangClose("zh")}
                            >
                                简体中文
                            </MenuItem>
                        </Menu>
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
                                    {open && (
                                        <ListItemText primary={item.text} />
                                    )}
                                </ListItem>
                            );
                            return !open ? (
                                <Tooltip
                                    key={item.key}
                                    title={item.text}
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
                    }}
                >
                    <img
                        src={volcanoLogo}
                        alt="Volcano Logo"
                        style={{
                            maxWidth: open ? "150px" : "60px",
                            height: "auto",
                            transition: "max-width 0.2s",
                            marginBottom: "1px",
                        }}
                    />
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
