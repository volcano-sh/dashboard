import React, { useState, useContext } from "react";
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

// use relative path to load Logo
import volcanoLogo from "../assets/volcano-icon-color.svg";

// Create and export the context once
export const ErrorContext = React.createContext({
    hasError: false,
    errorMessage: "",
    setError: () => {},
    clearError: () => {},
});

const Layout = () => {
    // Hooks must be used inside component functions
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const [globalError, setGlobalError] = useState({
        hasError: false,
        message: "",
        severity: "error", // can be 'error', 'warning', 'info', 'success'
    });
    const [showErrorBanner, setShowErrorBanner] = useState(true);

    // Error context value
    const errorContextValue = {
        hasError: globalError.hasError,
        errorMessage: globalError.message,
        setError: (message, severity = "error") => {
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
        },
    };

    // constants can be kept outside the component
    const volcanoOrange = "#E34C26"; // orange red theme
    const headerGrey = "#424242"; // dark gray top stripe
    const drawerWidth = 240;

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleDismissError = () => {
        setShowErrorBanner(false);
    };

    const handleRetryConnection = () => {
        // Here you would implement your retry logic
        // For now, just clear the error and show a temporary info message
        errorContextValue.clearError();
        errorContextValue.setError("Attempting to reconnect...", "info");
        
        // Simulate trying to reconnect
        setTimeout(() => {
            // This would be replaced with actual API check results
            const reconnectSuccessful = Math.random() > 0.5;
            
            if (reconnectSuccessful) {
                errorContextValue.clearError();
            } else {
                errorContextValue.setError("Failed to reconnect. Services are still unavailable.", "error");
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
                
                {/* Main content box with the error banner inside */}
                <Box
                    component="main"
                    sx={{ 
                        flexGrow: 1, 
                        p: 3, 
                        backgroundColor: "white",
                    }}
                >
                    <Toolbar />
                    
                    {/* Place error banner at the top of the main content area */}
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
                                mb: 3 // Add margin bottom to separate from content
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