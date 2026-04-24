import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import {
    AppBar,
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Toolbar,
    Typography,
    Tooltip,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DeviceHubOutlinedIcon from "@mui/icons-material/DeviceHubOutlined";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import QueryStatsOutlinedIcon from "@mui/icons-material/QueryStatsOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";

const Layout = () => {
    // Hooks must be used inside component functions
    const location = useLocation();
    const [open, setOpen] = useState(true);
    const [adminOpen, setAdminOpen] = useState(false);

    // constants can be kept outside the component
    const headerGrey = "#424242"; // dark gray top stripe
    const drawerWidth = 280;
    const collapsedDrawerWidth = 60;
    const iconProps = { sx: { fontSize: 18 } };

    const handleDrawerToggle = () => {
        setOpen(!open);
    };

    const handleAdminToggle = () => {
        setAdminOpen((previous) => !previous);
    };

    const menuSections = [
        {
            items: [
                {
                    text: "Overview",
                    icon: <HomeOutlinedIcon {...iconProps} />,
                    path: "/dashboard",
                },
            ],
        },
        {
            title: "Scheduling",
            items: [
                {
                    text: "Queues",
                    icon: <DeviceHubOutlinedIcon {...iconProps} />,
                    path: "/scheduling/queues",
                },
                {
                    text: "Jobs",
                    icon: <WorkOutlineOutlinedIcon {...iconProps} />,
                    path: "/scheduling/jobs",
                },
                {
                    text: "Pod Groups",
                    icon: <DeviceHubOutlinedIcon {...iconProps} />,
                    path: "/scheduling/podgroups",
                },
            ],
        },
        {
            title: "Workloads",
            items: [
                {
                    text: "Pods",
                    icon: <Inventory2OutlinedIcon {...iconProps} />,
                    path: "/workload/pods",
                },
            ],
        },
        {
            title: "Observability",
            items: [
                {
                    text: "Events",
                    icon: <NotificationsNoneOutlinedIcon {...iconProps} />,
                    disabled: true,
                },
                {
                    text: "Metrics",
                    icon: <QueryStatsOutlinedIcon {...iconProps} />,
                    disabled: true,
                },
            ],
        },
        {
            title: "System",
            items: [
                {
                    text: "Configuration",
                    icon: <TuneOutlinedIcon {...iconProps} />,
                    path: "/system/configuration",
                },
                {
                    text: "Cluster Information",
                    icon: <DnsOutlinedIcon {...iconProps} />,
                    path: "/system/cluster-information",
                },
            ],
        },
    ];

    const footerItems = [
        {
            text: "Documentation",
            icon: <DescriptionOutlinedIcon {...iconProps} />,
            path: "/documentation",
        },
    ];

    const renderMenuItem = (item) => {
        const active =
            item.path &&
            (location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`));
        const itemStyles = {
            minHeight: 38,
            mx: open ? 1.25 : 0.75,
            my: 0.25,
            px: open ? 1.25 : 1,
            borderRadius: "6px",
            color: item.disabled ? "text.disabled" : "text.primary",
            justifyContent: open ? "flex-start" : "center",
            "&.active": {
                bgcolor: "rgba(0, 0, 0, 0.08)",
                "& .MuiListItemIcon-root": {
                    color: "text.primary",
                },
                "& .MuiListItemText-primary": {
                    color: "text.primary",
                    fontWeight: 600,
                },
            },
            "&:hover": {
                backgroundColor: item.disabled
                    ? "transparent"
                    : "rgba(0, 0, 0, 0.08)",
            },
        };

        const content = item.disabled ? (
            <ListItem
                key={item.text}
                aria-disabled="true"
                sx={{
                    ...itemStyles,
                    cursor: "not-allowed",
                    opacity: 0.58,
                }}
            >
                <ListItemIcon
                    sx={{
                        minWidth: open ? 34 : 0,
                        color: "inherit",
                        justifyContent: "center",
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {open && (
                    <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: 13 }}
                    />
                )}
            </ListItem>
        ) : (
            <ListItemButton
                key={item.text}
                component={Link}
                to={item.path}
                className={active ? "active" : ""}
                sx={itemStyles}
            >
                <ListItemIcon
                    sx={{
                        minWidth: open ? 34 : 0,
                        color: "inherit",
                        justifyContent: "center",
                    }}
                >
                    {item.icon}
                </ListItemIcon>
                {open && (
                    <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ fontSize: 13 }}
                    />
                )}
            </ListItemButton>
        );

        return !open ? (
            <Tooltip key={item.text} title={item.text} placement="right">
                {content}
            </Tooltip>
        ) : (
            <React.Fragment key={item.text}>{content}</React.Fragment>
        );
    };

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
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
                        <MenuIcon sx={{ fontSize: 20 }} />
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
                    width: open ? drawerWidth : collapsedDrawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: {
                        width: open ? drawerWidth : collapsedDrawerWidth,
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
                    {menuSections.map((section, sectionIndex) => (
                        <Box
                            key={section.title || "primary"}
                            sx={{
                                borderTop:
                                    sectionIndex === 0
                                        ? "none"
                                        : "1px solid rgba(0, 0, 0, 0.08)",
                                pt: sectionIndex === 0 ? 1 : 1.25,
                                mt: sectionIndex === 0 ? 0 : 0.75,
                            }}
                        >
                            {open && section.title && (
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: "text.secondary",
                                        display: "block",
                                        fontSize: 11,
                                        fontWeight: 600,
                                        letterSpacing: "0.03em",
                                        px: 2,
                                        pb: 0.5,
                                        textTransform: "uppercase",
                                    }}
                                >
                                    {section.title}
                                </Typography>
                            )}
                            <List dense disablePadding>
                                {section.items.map(renderMenuItem)}
                            </List>
                        </Box>
                    ))}
                </Box>
                <Box
                    sx={{
                        borderTop: "1px solid rgba(0, 0, 0, 0.08)",
                        px: 0,
                        py: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        mt: "auto",
                    }}
                >
                    <List dense disablePadding>
                        {footerItems.map(renderMenuItem)}
                    </List>
                    <ListItemButton
                        aria-expanded={adminOpen}
                        aria-label="Toggle admin menu"
                        onClick={handleAdminToggle}
                        sx={{
                            alignItems: "center",
                            borderRadius: "6px",
                            display: "flex",
                            gap: 1.25,
                            justifyContent: open ? "space-between" : "center",
                            minHeight: 34,
                            mx: open ? 1.25 : 0.75,
                            px: open ? 1.25 : 1,
                            "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.08)",
                            },
                        }}
                    >
                        <Box
                            sx={{
                                alignItems: "center",
                                display: "flex",
                                gap: 1,
                            }}
                        >
                            <AccountCircleOutlinedIcon {...iconProps} />
                            {open && (
                                <Typography sx={{ fontSize: 13 }}>
                                    admin
                                </Typography>
                            )}
                        </Box>
                        {open &&
                            (adminOpen ? (
                                <ExpandLessIcon {...iconProps} />
                            ) : (
                                <ExpandMoreIcon {...iconProps} />
                            ))}
                    </ListItemButton>
                    {open && adminOpen && (
                        <Box
                            sx={{
                                bgcolor: "#ffffff",
                                border: "1px solid rgba(0, 0, 0, 0.12)",
                                borderRadius: 1,
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
                                mx: 0.5,
                                overflow: "hidden",
                            }}
                        >
                            <Box
                                sx={{
                                    alignItems: "center",
                                    borderBottom:
                                        "1px solid rgba(0, 0, 0, 0.08)",
                                    display: "flex",
                                    gap: 1,
                                    px: 1.5,
                                    py: 1.25,
                                }}
                            >
                                <MailOutlineIcon {...iconProps} />
                                <Box>
                                    <Typography sx={{ fontSize: 13 }}>
                                        admin@example.com
                                    </Typography>
                                    <Typography
                                        color="text.secondary"
                                        sx={{ fontSize: 11 }}
                                    >
                                        Cluster administrator
                                    </Typography>
                                </Box>
                            </Box>
                            <ListItemButton
                                sx={{
                                    gap: 1,
                                    minHeight: 40,
                                    px: 1.5,
                                }}
                            >
                                <LogoutOutlinedIcon {...iconProps} />
                                <Typography sx={{ fontSize: 13 }}>
                                    Logout
                                </Typography>
                            </ListItemButton>
                        </Box>
                    )}
                    <img
                        src="/volcano-icon-color.svg"
                        alt="Volcano Logo"
                        style={{
                            alignSelf: "center",
                            maxWidth: open ? "120px" : "36px",
                            height: "auto",
                            transition: "max-width 0.2s",
                        }}
                    />
                </Box>
            </Drawer>
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: "#ffffff",
                    minWidth: 0,
                }}
            >
                <Toolbar />
                <Outlet />
            </Box>
        </Box>
    );
};

export default Layout;
