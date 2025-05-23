import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Tooltip,
    Divider,
    Badge,
} from "@mui/material";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";

const Sidebar = ({ open, volcanoLogo }) => {
    const location = useLocation();
    
    // Theme constants
    const volcanoOrange = "#E34C26";
    const drawerWidth = 240;
    const closedDrawerWidth = 68;

    // Group menu items
    const menuItems = [
        { 
            text: "Dashboard", 
            icon: <HomeIcon />, 
            path: "/dashboard",
            badge: null
        },
        { 
            text: "Jobs", 
            icon: <AssignmentIcon />, 
            path: "/jobs",
            badge: null
        },
        { 
            text: "Queues", 
            icon: <CloudIcon />, 
            path: "/queues",
            badge: null
        },
        { 
            text: "Pods", 
            icon: <WorkspacesIcon />, 
            path: "/pods",
            badge: null
        },
    ];

    return (
        <Drawer
            data-testid="sidebar-drawer"
            variant="permanent"
            sx={{
                width: open ? drawerWidth : closedDrawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: open ? drawerWidth : closedDrawerWidth,
                    boxSizing: "border-box",
                    backgroundColor: "#f5f5f5",
                    transition: "width 0.3s ease-in-out",
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
                        const isActive = location.pathname === item.path;
                        const listItem = (
                            <ListItem
                                button
                                component={Link}
                                to={item.path}
                                className={isActive ? "active" : ""}
                                sx={{
                                    py: 1.5,
                                    "&.active": {
                                        bgcolor: "rgba(227, 76, 38, 0.08)",
                                        borderRight: `3px solid ${volcanoOrange}`,
                                        "& .MuiListItemIcon-root": {
                                            color: volcanoOrange,
                                        },
                                        "& .MuiListItemText-primary": {
                                            color: volcanoOrange,
                                            fontWeight: 600,
                                        },
                                    },
                                    "&:hover": {
                                        backgroundColor: isActive 
                                            ? "rgba(227, 76, 38, 0.08)" 
                                            : "rgba(0, 0, 0, 0.1)",
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40, ml: 1 }}>
                                    {item.badge !== null ? (
                                        <Badge 
                                            badgeContent={item.badge} 
                                            color="primary"
                                            sx={{
                                                "& .MuiBadge-badge": {
                                                    backgroundColor: volcanoOrange
                                                }
                                            }}
                                        >
                                            {item.icon}
                                        </Badge>
                                    ) : (
                                        item.icon
                                    )}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText 
                                        primary={item.text} 
                                        primaryTypographyProps={{
                                            fontSize: '0.95rem',
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
            
            <Divider sx={{ mb: 1, opacity: 0.6 }} />
            
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
                <Tooltip title="Volcano" placement="right">
                    <img
                        src={volcanoLogo}
                        alt="Volcano Logo"
                        style={{
                            maxWidth: open ? "110px" : "40px",
                            height: "auto",
                            transition: "max-width 0.3s ease-in-out",
                            marginBottom: "1px",
                        }}
                    />
                </Tooltip>
                {open && (
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 500,
                            color: "#666",
                            fontSize: "0.7rem",
                            mt: 0.5,
                        }}
                    >
                        CNCF Batch Scheduling
                    </Typography>
                )}
            </Box>
        </Drawer>
    );
};

export default Sidebar;