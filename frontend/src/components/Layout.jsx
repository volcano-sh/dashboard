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
    Backdrop,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";

// Logo import
import volcanoLogo from "../assets/volcano-icon-color.svg";

const Layout = () => {
    const location = useLocation();
    const [open, setOpen] = useState(false); // Set default to false for overlay effect

    const volcanoOrange = "#E34C26";
    const headerGrey = "#424242";
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
            {/* Top Navigation Bar */}
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
                        sx={{ color: "#ffffff", fontWeight: 500 }}
                    >
                        Volcano Dashboard
                    </Typography>
                </Toolbar>
            </AppBar>

            {/* Drawer (Overlay Style) */}
            <Drawer
                variant="temporary"
                open={open}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true, // Improves performance on mobile
                }}
                sx={{
                    "& .MuiDrawer-paper": {
                        width: drawerWidth,
                        boxSizing: "border-box",
                        backgroundColor: "#f5f5f5",
                        position: "fixed",
                        height: "100vh",
                        transition: "width 0.2s ease-in-out",
                    },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: "auto", flexGrow: 1 }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem
                                button
                                key={item.text}
                                component={Link}
                                to={item.path}
                                className={location.pathname === item.path ? "active" : ""}
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
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Logo Section */}
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
        maxWidth: "115%",
        height: "auto",
        marginBottom: "1px",
        '@media (min-width: 600px)': {
            display: "block",
        },
    }}
/>
                </Box>
            </Drawer>

            {/* Backdrop (Dim screen when drawer is open) */}
            {open && (
                <Backdrop
                    open={open}
                    onClick={handleDrawerToggle}
                    sx={{ zIndex: (theme) => theme.zIndex.drawer - 1, backgroundColor: "rgba(0,0,0,0.4)" }}
                />
            )}

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: "white",
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
