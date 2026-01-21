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
    Badge,
    Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import CategoryIcon from "@mui/icons-material/Category";


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
        { text: "PodGroups", icon: <CategoryIcon />, path: "/podgroups" },
    ];

    return (
        <Box sx={{ display: "flex" }}>
            <AppBar
                position="fixed"
                sx={{
                    zIndex: (theme) => theme.zIndex.drawer + 1,
                    bgcolor: headerGrey,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)", // Enhanced shadow
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
                    
                    {/* Enhanced Logo Section */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <img
                            src={volcanoLogo}
                            alt="Volcano Logo"
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px"
                            }}
                        />
                        <Typography
                            variant="h6"
                            noWrap
                            component="div"
                            sx={{
                                color: "#ffffff",
                                fontWeight: 600,
                                letterSpacing: "0.5px"
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
                        backgroundColor: "#fafafa", // Slightly lighter background
                        transition: "width 0.2s",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        borderRight: "1px solid rgba(0,0,0,0.08)", // Subtle border
                        boxShadow: "2px 0 8px rgba(0,0,0,0.05)", // Subtle shadow
                    },
                }}
            >
                <Toolbar />
                
                {/* Enhanced Navigation Header */}
                {open && (
                    <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                        <Typography 
                            variant="overline" 
                            sx={{ 
                                color: "text.secondary",
                                fontWeight: 600,
                                letterSpacing: "1px",
                                fontSize: "0.7rem"
                            }}
                        >
                            NAVIGATION
                        </Typography>
                    </Box>
                )}

                <Box sx={{ overflow: "hidden auto", flexGrow: 1, px: 1 }}>
                    <List>
                        {menuItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            
                            const listItem = (
                                <ListItem
                                    key={item.text}
                                    component={Link}
                                    to={item.path}
                                    sx={{
                                        color: "inherit",
                                        textDecoration: "none",
                                        borderRadius: 2,
                                        mb: 0.5,
                                        position: "relative",
                                        minHeight: 48,
                                        justifyContent: open ? "flex-start" : "center",
                                        px: open ? 2 : 1, // Better padding for centering
                                        bgcolor: isActive ? `${volcanoOrange}15` : "transparent",
                                        border: isActive ? `1px solid ${volcanoOrange}30` : "1px solid transparent",
                                        "&:hover": {
                                            backgroundColor: isActive ? `${volcanoOrange}20` : "rgba(0, 0, 0, 0.04)",
                                        },
                                        "& .MuiListItemIcon-root": {
                                            color: isActive ? volcanoOrange : "text.secondary",
                                            minWidth: 40,
                                            justifyContent: "center",
                                            mr: open ? 0 : 0 // Center icons when collapsed
                                        },
                                        "& .MuiListItemText-primary": {
                                            fontWeight: isActive ? 600 : 500,
                                            color: isActive ? volcanoOrange : "text.primary",
                                            fontSize: "0.9rem"
                                        }
                                    }}
                                >
                                    <ListItemIcon>{item.icon}</ListItemIcon>
                                    {open && (
                                        <ListItemText primary={item.text} />
                                    )}
                                    
                                    {/* Active indicator line */}
                                    {isActive && (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                left: 0,
                                                top: "50%",
                                                transform: "translateY(-50%)",
                                                width: 3,
                                                height: 24,
                                                bgcolor: volcanoOrange,
                                                borderRadius: "0 2px 2px 0"
                                            }}
                                        />
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
                
                {/* Enhanced Logo section */}
                <Box
                    sx={{
                        p: open ? 2 : 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        mt: "auto",
                        mb: 1,
                        borderTop: "1px solid rgba(0, 0, 0, 0.08)", // Subtle divider
                    }}
                >
                    <img
                        src={volcanoLogo}
                        alt="Volcano Logo"
                        style={{
                            maxWidth: open ? "120px" : "40px", // Slightly smaller when expanded
                            height: "auto",
                            transition: "max-width 0.2s",
                            marginBottom: open ? "8px" : "4px",
                        }}
                    />
                    {open && (
                        <Typography
                            variant="caption"
                            sx={{
                                color: "text.secondary",
                                fontWeight: 500,
                                textAlign: "center"
                            }}
                        >
                        </Typography>
                    )}
                </Box>
            </Drawer>
            
            <Box
                component="main"
                sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    backgroundColor: "#fafafa" // Consistent background
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;