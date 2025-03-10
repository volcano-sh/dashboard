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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";

// use relative path to load Logo
import volcanoLogo from "../assets/volcano-icon-color.svg";

const Layout = () => {
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
                </Toolbar>
            </AppBar>

            <Drawer
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
                <Box sx={{ overflow: "auto", flexGrow: 1 }}>
                    <List>
                        {menuItems.map((item) => (
                            <ListItem
                                button
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
                                }}
                            >
                                <ListItemIcon>{item.icon}</ListItemIcon>
                                {open && <ListItemText primary={item.text} />}
                            </ListItem>
                        ))}
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
                            maxWidth: open ? "115%" : "60px",
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
