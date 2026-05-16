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
    Button,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import CategoryIcon from "@mui/icons-material/Category";
import LanguageIcon from "@mui/icons-material/Language";
import { useTranslation } from "react-i18next";

// use relative path to load Logo
import volcanoLogo from "../assets/volcano-icon-color.svg";

const Layout = () => {
    const { t, i18n } = useTranslation();
    // Hooks must be used inside component functions
    const location = useLocation();
    const [open, setOpen] = useState(true);

    // constants can be kept outside the component
    const volcanoOrange = "#E34C26"; // orange red theme
    const headerGrey = "#424242"; // dark gray top stripe
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const menuItems = [
        { text: t("dashboard"), icon: <HomeIcon />, path: "/dashboard" },
        { text: t("jobs"), icon: <AssignmentIcon />, path: "/jobs" },
        { text: t("queues"), icon: <CloudIcon />, path: "/queues" },
        { text: t("pods"), icon: <WorkspacesIcon />, path: "/pods" },
        { text: t("pod_groups"), icon: <CategoryIcon />, path: "/podgroups" },
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
                        aria-label={t("toggle_drawer")}
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
                        {t("app_title")}
                    </Typography>
                    <Button
                        color="inherit"
                        startIcon={<LanguageIcon />}
                        onClick={() =>
                            i18n.changeLanguage(
                                i18n.language === "en" ? "zh" : "en",
                            )
                        }
                        sx={{ color: "white" }}
                    >
                        {i18n.language.startsWith("en") ? "中文" : "EN"}
                    </Button>
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
                                    key={item.text}
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
                                    key={item.text}
                                    title={item.text}
                                    placement="right"
                                >
                                    {listItem}
                                </Tooltip>
                            ) : (
                                <React.Fragment key={item.text}>
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
                        alt={t("volcano_logo_alt")}
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
