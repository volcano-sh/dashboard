"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Box,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
} from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import DnsOutlinedIcon from "@mui/icons-material/DnsOutlined";
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

const drawerWidth = 280;
const collapsedDrawerWidth = 60;
const iconProps = { sx: { fontSize: 18 } };

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

export default function DashboardShell({ children }) {
    const theme = useTheme();
    const isOverlayDrawer = useMediaQuery(theme.breakpoints.down("lg"));
    const pathname = usePathname();
    const [open, setOpen] = useState(true);
    const [adminOpen, setAdminOpen] = useState(false);

    useEffect(() => {
        setOpen((previous) =>
            isOverlayDrawer ? false : previous === false ? false : true,
        );
    }, [isOverlayDrawer]);

    const renderMenuItem = (item) => {
        const active =
            item.path &&
            (pathname === item.path || pathname.startsWith(`${item.path}/`));
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
                href={item.path}
                className={active ? "active" : ""}
                onClick={() => {
                    if (isOverlayDrawer) {
                        setOpen(false);
                    }
                }}
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

    const drawerPaperSx = useMemo(
        () => ({
            width: isOverlayDrawer
                ? drawerWidth
                : open
                  ? drawerWidth
                  : collapsedDrawerWidth,
            boxSizing: "border-box",
            backgroundColor: "#f5f5f5",
            transition: "width 0.2s",
            overflowX: "hidden",
            display: "flex",
            flexDirection: "column",
        }),
        [isOverlayDrawer, open],
    );

    const drawerContent = (
        <>
            <Box
                sx={{
                    alignItems: "center",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
                    display: "flex",
                    gap: open ? 1.25 : 0,
                    justifyContent: open ? "flex-start" : "center",
                    minHeight: 58,
                    px: open ? 1.5 : 0,
                }}
            >
                <IconButton
                    aria-label="toggle drawer"
                    onClick={() => setOpen((value) => !value)}
                    size="small"
                    sx={{ color: "text.primary" }}
                >
                    <MenuIcon sx={{ fontSize: 20 }} />
                </IconButton>
                {open && (
                    <Typography
                        component="div"
                        noWrap
                        sx={{ color: "text.primary", fontWeight: 600 }}
                    >
                        Volcano Dashboard
                    </Typography>
                )}
            </Box>
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
                    onClick={() => setAdminOpen((value) => !value)}
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
                            <Typography sx={{ fontSize: 13 }}>admin</Typography>
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
                                borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
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
                        <ListItemButton sx={{ gap: 1, minHeight: 40, px: 1.5 }}>
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
        </>
    );

    return (
        <Box sx={{ display: "flex", minHeight: "100vh" }}>
            {isOverlayDrawer && !open && (
                <IconButton
                    aria-label="open navigation"
                    onClick={() => setOpen(true)}
                    size="small"
                    sx={{
                        bgcolor: "#ffffff",
                        border: "1px solid rgba(0, 0, 0, 0.12)",
                        boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                        left: 12,
                        position: "fixed",
                        top: 12,
                        zIndex: (muiTheme) => muiTheme.zIndex.drawer + 1,
                        "&:hover": { bgcolor: "#f8fafc" },
                    }}
                >
                    <MenuIcon sx={{ fontSize: 20 }} />
                </IconButton>
            )}

            {isOverlayDrawer ? (
                <Drawer
                    data-testid="sidebar-drawer"
                    ModalProps={{ keepMounted: true }}
                    onClose={() => setOpen(false)}
                    open={open}
                    sx={{
                        [`& .MuiDrawer-paper`]: drawerPaperSx,
                    }}
                    variant="temporary"
                >
                    {drawerContent}
                </Drawer>
            ) : (
                <Drawer
                    data-testid="sidebar-drawer"
                    sx={{
                        width: open ? drawerWidth : collapsedDrawerWidth,
                        flexShrink: 0,
                        [`& .MuiDrawer-paper`]: drawerPaperSx,
                    }}
                    variant="permanent"
                >
                    {drawerContent}
                </Drawer>
            )}

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    backgroundColor: "#ffffff",
                    minWidth: 0,
                }}
            >
                {children}
            </Box>
        </Box>
    );
}
