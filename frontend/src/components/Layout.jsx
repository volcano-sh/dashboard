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
    Menu,
    MenuItem,
    Toolbar,
    Tooltip,
    Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import CategoryIcon from "@mui/icons-material/Category";
import LanguageIcon from "@mui/icons-material/Language";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";

import volcanoLogo from "../assets/volcano-icon-color.svg";

const LANGUAGES = [
    { code: "en", label: "English" },
    { code: "zh", label: "中文 (Chinese)" },
];

const Layout = () => {
    const location = useLocation();
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [langAnchorEl, setLangAnchorEl] = useState(null);
    const { t, i18n } = useTranslation();

    const volcanoOrange = "#E34C26";
    const headerGrey = "#424242";
    const drawerWidth = 240;

    const handleDrawerToggle = () => setDrawerOpen((v) => !v);

    const handleLangMenuOpen = (e) => setLangAnchorEl(e.currentTarget);
    const handleLangMenuClose = () => setLangAnchorEl(null);
    const handleLangSelect = (code) => {
        i18n.changeLanguage(code);
        handleLangMenuClose();
    };

    const menuItems = [
        { text: t("nav.dashboard"), icon: <HomeIcon />, path: "/dashboard" },
        { text: t("nav.jobs"), icon: <AssignmentIcon />, path: "/jobs" },
        { text: t("nav.queues"), icon: <CloudIcon />, path: "/queues" },
        { text: t("nav.pods"), icon: <WorkspacesIcon />, path: "/pods" },
        { text: t("nav.podGroups"), icon: <CategoryIcon />, path: "/podgroups" },
    ];

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar
                position="fixed"
                sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: headerGrey }}
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
                        sx={{ color: "#ffffff", fontWeight: 500, flexGrow: 1 }}
                    >
                        {t("nav.appTitle")}
                    </Typography>

                    {/* Language selector */}
                    <Tooltip title={t("language.label")}>
                        <IconButton
                            onClick={handleLangMenuOpen}
                            size="small"
                            sx={{
                                color: "white",
                                border: "1px solid rgba(255,255,255,0.35)",
                                borderRadius: "6px",
                                px: 1,
                                gap: 0.5,
                                "&:hover": {
                                    backgroundColor: "rgba(255,255,255,0.12)",
                                    border: "1px solid rgba(255,255,255,0.7)",
                                },
                            }}
                            aria-controls={langAnchorEl ? "lang-menu" : undefined}
                            aria-haspopup="true"
                        >
                            <LanguageIcon fontSize="small" />
                            <Typography
                                variant="caption"
                                sx={{ fontWeight: 700, letterSpacing: "0.04em", ml: 0.25 }}
                            >
                                {i18n.language === "zh" ? "中文" : "EN"}
                            </Typography>
                        </IconButton>
                    </Tooltip>

                    <Menu
                        id="lang-menu"
                        anchorEl={langAnchorEl}
                        open={Boolean(langAnchorEl)}
                        onClose={handleLangMenuClose}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                        PaperProps={{
                            elevation: 4,
                            sx: {
                                mt: 1,
                                minWidth: 180,
                                borderRadius: "8px",
                                overflow: "hidden",
                            },
                        }}
                    >
                        {LANGUAGES.map(({ code, label }) => {
                            const isActive = i18n.language === code;
                            return (
                                <MenuItem
                                    key={code}
                                    onClick={() => handleLangSelect(code)}
                                    selected={isActive}
                                    sx={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 2,
                                        fontWeight: isActive ? 700 : 400,
                                        color: isActive ? volcanoOrange : "inherit",
                                        "&.Mui-selected": {
                                            backgroundColor: "rgba(227,76,38,0.08)",
                                        },
                                        "&.Mui-selected:hover": {
                                            backgroundColor: "rgba(227,76,38,0.14)",
                                        },
                                    }}
                                >
                                    {label}
                                    {isActive && (
                                        <CheckIcon
                                            fontSize="small"
                                            sx={{ color: volcanoOrange }}
                                        />
                                    )}
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </Toolbar>
            </AppBar>

            <Drawer
                data-testid="sidebar-drawer"
                variant="permanent"
                sx={{
                    width: drawerOpen ? drawerWidth : 60,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: drawerOpen ? drawerWidth : 60,
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
                                    key={item.text}
                                    component={Link}
                                    to={item.path}
                                    className={
                                        location.pathname === item.path ? "active" : ""
                                    }
                                    sx={{
                                        "&.active": {
                                            bgcolor: "rgba(0, 0, 0, 0.08)",
                                            "& .MuiListItemIcon-root": { color: volcanoOrange },
                                            "& .MuiListItemText-primary": {
                                                color: volcanoOrange,
                                                fontWeight: 500,
                                            },
                                        },
                                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.1)" },
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    {drawerOpen && <ListItemText primary={item.text} />}
                                </ListItem>
                            );

                            return !drawerOpen ? (
                                <Tooltip key={item.text} title={item.text} placement="right">
                                    {listItem}
                                </Tooltip>
                            ) : (
                                <React.Fragment key={item.text}>{listItem}</React.Fragment>
                            );
                        })}
                    </List>
                </Box>

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
                            maxWidth: drawerOpen ? "150px" : "60px",
                            height: "auto",
                            transition: "max-width 0.2s",
                            marginBottom: "1px",
                        }}
                    />
                </Box>
            </Drawer>

            <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: "white" }}>
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
