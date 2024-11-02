import React, { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom"; // 添加 useLocation
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import WorkIcon from "@mui/icons-material/Work";
import QueueIcon from "@mui/icons-material/Queue";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";

// 使用相对路径导入 Logo
import volcanoLogo from '../assets/volcano-icon-color.svg';


const Layout = () => {
  // Hooks 必须在组件函数内部使用
  const location = useLocation();
  const [open, setOpen] = useState(true);

  // 常量可以保持在组件外部
  const volcanoOrange = "#E34C26"; // 主题橙红色
  const headerGrey = "#424242"; // 顶部条纹深灰色
  const drawerWidth = 240;

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Jobs", icon: <WorkIcon />, path: "/jobs" },
    { text: "Queues", icon: <QueueIcon />, path: "/queues" },
    { text: "Pods", icon: <DeviceHubIcon />, path: "/pods" },
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
                {open && <ListItemText primary={item.text} />}
              </ListItem>
            ))}
          </List>
        </Box>
        {/* Logo 和文字部分 */}
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
