import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";
import CloudOutlinedIcon from '@mui/icons-material/CloudOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import WorkspacesOutlinedIcon from '@mui/icons-material/WorkspacesOutlined';
import volcanoLogo from '../assets/volcano-icon-color.svg';

const Layout = () => {
    const location = useLocation();
    const [open, setOpen] = useState(true);

    const volcanoOrange = "#E34C26";
    const drawerWidth = 240;

    const menuItems = [
        { text: "Dashboard", icon: <HomeOutlinedIcon />, path: "/dashboard" },
        { text: "Jobs", icon: <AssignmentOutlinedIcon />, path: "/jobs" },
        { text: "Queues", icon: <CloudOutlinedIcon />, path: "/queues" },
        { text: "Pods", icon: <WorkspacesOutlinedIcon />, path: "/pods" },
    ];

    return (
        <Box sx={{ display: "flex" }}>
            <Drawer
                variant="permanent"
                sx={{
                    width: open ? drawerWidth : 60,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: open ? drawerWidth : 60,
                        boxSizing: "border-box",
                        backgroundColor: "#white",
                        transition: "width 0.5s",
                        overflowX: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "15px",
                        "& .MuiList-root": {
                            "&:hover .MuiListItem-root": {
                                opacity: 0.5,
                                transform: "scale(0.95)",
                                transition: "all 0.3s ease-out",
                            },
                            "& .MuiListItem-root:hover": {
                                opacity: 1,
                                transform: "scale(1.05)",
                                backgroundColor: "rgba(230, 58, 15, 0.1)", 
                                transition: "all 0.3s ease-out",
                                "& .MuiListItemIcon-root": {
                                    color: volcanoOrange,
                                    transform: "scale(1.1)",
                                    transition: "all 0.3s ease-out",
                                },
                                "& .MuiListItemText-primary": {
                                    color: volcanoOrange,
                                    fontWeight: 600,
                                    transform: "translateX(10px)",
                                    transition: "all 0.3s ease-out",
                                },
                            },
                        },
                    },
                }}
            >
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
                    <Box sx={{ display: "flex", alignItems: "center",marginTop:"10px" }}>
                        <img
                            src={volcanoLogo}
                            alt="Volcano Logo"
                            style={{
                                maxWidth: "45px",
                                height: "auto",
                                transition: "max-width 0.2s",
                                marginBottom: "1px",
                                marginRight: "5px",
                            }}
                        />
                        <Typography
                            sx={{
                                fontWeight: 700,
                                color: volcanoOrange,
                                fontSize: "1.6rem",
                                letterSpacing: "0.1em",
                                fontFamily: "'Ubuntu', sans-serif",
                                marginRight: "50px",
                            }}
                        >
                            Volcano
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ overflow: "auto", flexGrow: 1}}>
                    <List>
                        {menuItems.map((item) => (
                          <ListItem
                          button
                          key={item.text}
                          component={Link}
                          to={item.path}
                          sx={{
                              transition: "all 0.3s ease-out",
                              margin: "8px 0",
                              borderRadius: "0px 30px 30px 0px",
                              "&.active": {
                                  bgcolor: "rgba(224, 55, 13, 0.1)",
                                  "& .MuiListItemIcon-root": {
                                      color: volcanoOrange,
                                  },
                                  "& .MuiListItemText-primary": {
                                      color: volcanoOrange,
                                      fontWeight: 500,
                                  },
                              },
                              "&:hover": {
                                  borderRadius: "0px 30px 30px 0px", // Adjusted border-radius for one side (left side)
                                  backgroundColor: "rgba(230, 58, 15, 0.1)", // Optional: change background color on hover
                                  transform: "scale(1.05)", // Optional: scale effect for hover
                              },
                          }}
                          className={location.pathname === item.path ? "active" : ""}
                      >
                                <ListItemIcon
                                    sx={{
                                        transition: "all 0.3s ease-out",
                                        minWidth: "40px",
                                    }}
                                >
                                    {item.icon}
                                </ListItemIcon>
                                {open && (
                                    <ListItemText
                                        primary={item.text}
                                        sx={{
                                            transition: "all 0.3s ease-out",
                                            color: "grey", 
                                            "& .MuiTypography-root": {
                                                transition: "all 0.3s ease-out",
                                            },
                                        }}
                                    />
                                )}
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: "white" }}>
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;