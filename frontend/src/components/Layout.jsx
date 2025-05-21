import React, { useState, useContext, useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    Alert,
    AlertTitle,
    AppBar,
    Box,
    Button,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloudIcon from "@mui/icons-material/Cloud";
import HomeIcon from "@mui/icons-material/Home";
import AssignmentIcon from "@mui/icons-material/Assignment";
import WorkspacesIcon from "@mui/icons-material/Workspaces";
import RefreshIcon from "@mui/icons-material/Refresh";
import CloseIcon from "@mui/icons-material/Close";
import { resetBackendStatus } from "../App";

import volcanoLogo from "../assets/volcano-icon-color.svg";

export const ErrorContext = React.createContext({
    hasError: false,
    errorMessage: "",
    setError: () => {},
    clearError: () => {},
});

const Layout = () => {
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const [globalError, setGlobalError] = useState({
        hasError: false,
        message: "",
        severity: "error",
    });
    const [showErrorBanner, setShowErrorBanner] = useState(true);

    const errorContextValue = {
        hasError: globalError.hasError,
        errorMessage: globalError.message,
        setError: (message, severity = "error") => {
            if (!message) return;
            
            setGlobalError({
                hasError: true,
                message,
                severity,
            });
            setShowErrorBanner(true);
        },
        clearError: () => {
            setGlobalError({
                hasError: false,
                message: "",
                severity: "error",
            });
            setShowErrorBanner(false);
        },
    };

    useEffect(() => {
        errorContextValue.clearError();
    }, [location.pathname]);

    const volcanoOrange = "#E34C26";
    const headerGrey = "#424242";
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleDismissError = () => {
        errorContextValue.clearError();
    };

    const handleRetryConnection = () => {
        resetBackendStatus();
        
        errorContextValue.clearError();
        errorContextValue.setError("Attempting to reconnect...", "info");
        
        setTimeout(() => {
            if (globalError.severity === "info") {
                errorContextValue.clearError();
            }
        }, 2000);
    };

    const menuItems = [
        { text: "Dashboard", icon: <HomeIcon />, path: "/dashboard" },
        { text: "Jobs", icon: <AssignmentIcon />, path: "/jobs" },
        { text: "Queues", icon: <CloudIcon />, path: "/queues" },
        { text: "Pods", icon: <WorkspacesIcon />, path: "/pods" },
    ];

    return (
        <ErrorContext.Provider value={errorContextValue}>
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
                    sx={{ 
                        flexGrow: 1, 
                        p: 3, 
                        backgroundColor: "white",
                    }}
                >
                    <Toolbar />
                    
                    {globalError.hasError && showErrorBanner && (
                        <Alert 
                            severity={globalError.severity}
                            action={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {globalError.severity === 'error' && (
                                        <Button 
                                            color="inherit" 
                                            size="small"
                                            startIcon={<RefreshIcon />}
                                            onClick={handleRetryConnection}
                                            sx={{ mr: 1 }}
                                        >
                                            Retry
                                        </Button>
                                    )}
                                    <IconButton
                                        aria-label="close"
                                        color="inherit"
                                        size="small"
                                        onClick={handleDismissError}
                                    >
                                        <CloseIcon fontSize="inherit" />
                                    </IconButton>
                                </Box>
                            }
                            sx={{ 
                                borderRadius: 1,
                                mb: 3
                            }}
                        >
                            <AlertTitle>
                                {globalError.severity === 'error' ? 'Connection Error' : 
                                globalError.severity === 'warning' ? 'Warning' : 
                                globalError.severity === 'info' ? 'Information' : 'Success'}
                            </AlertTitle>
                            {globalError.message}
                        </Alert>
                    )}
                    
                    <Outlet />
                </Box>
            </Box>
        </ErrorContext.Provider>
    );
};

export default Layout;