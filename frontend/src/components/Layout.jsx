import React, { useState, useContext } from "react";
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
    useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import { ColorModeContext } from "../App";
import ThemeToggle from "./ThemeToggle";

// use relative path to load Logo
import volcanoLogo from "../assets/volcano-icon-color.svg";

const Layout = () => {
    // Hooks must be used inside component functions
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);

  // constants can be kept outside the component
    const volcanoOrange = "#E34C26"; // orange red theme
    const headerGrey = theme.palette.mode === "dark" ? "#1e1e1e" : "#424242";
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const menuItems = [
        { text: "Dashboard", icon: <HomeIcon />, path: "/dashboard" },
        { text: "Jobs", icon: <AssignmentIcon />, path: "/jobs" },
        { text: "Queues", icon: <CloudIcon />, path: "/queues" },
        { text: "Pods", icon: <WorkspacesIcon />, path: "/pods" },
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
                    <Box sx={{ display: "flex", alignItems: "center" }}>
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
                            }}
                        >
                            Volcano Dashboard
                        </Typography>
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
                        backgroundColor:
                            theme.palette.mode === "dark"
                                ? "#1e1e1e"
                                : "#f5f5f5",
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
                                        color: theme.palette.text.primary,
                                        "&.active": {
                                            bgcolor:
                                                theme.palette.mode === "dark"
                                                    ? "rgba(255, 255, 255, 0.08)"
                                                    : "rgba(0, 0, 0, 0.08)",
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
                                                theme.palette.mode === "dark"
                                                    ? "rgba(255, 255, 255, 0.1)"
                                                    : "rgba(0, 0, 0, 0.1)",
                                        },
                                    }}
                                >
                                    <ListItemIcon
                                        sx={{
                                            color: theme.palette.text.primary,
                                        }}
                                    >
                                        {item.icon}
                                    </ListItemIcon>
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
                        alt="Volcano Logo"
                        style={{
                            maxWidth: open ? "150px" : "60px",
                            height: "auto",
                            transition: "max-width 0.2s",
                            marginBottom: "1px",
                            filter:
                                theme.palette.mode === "dark"
                                    ? "brightness(0.8)"
                                    : "none",
                        }}
                    />
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: theme.palette.background.default,
                    color: theme.palette.text.primary,
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
