import React, { useState, useEffect, useCallback, useRef } from "react";
import {
    Box,
    IconButton,
    Tooltip,
    Typography,
    Switch,
    FormControlLabel,
    Popover,
    TextField,
    Button,
    Chip,
    Divider
} from "@mui/material";
import {
    Refresh as RefreshIcon,
    Settings as SettingsIcon,
    Schedule as ScheduleIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon
} from "@mui/icons-material";
import TitleComponent from "../Titlecomponent";

const DashboardHeader = ({ 
    onRefresh, 
    refreshing,
    onAutoRefreshChange // New callback for parent to handle auto-refresh state
}) => {
    // Auto-refresh state
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
    const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds
    const [customInterval, setCustomInterval] = useState(30);
    const [settingsAnchor, setSettingsAnchor] = useState(null);
    const [lastAutoRefresh, setLastAutoRefresh] = useState(null);
    const [refreshCount, setRefreshCount] = useState(0);
    
    // Refs for cleanup
    const autoRefreshTimer = useRef(null);
    const isManualRefresh = useRef(false);

    // Auto-refresh logic
    useEffect(() => {
        if (autoRefreshEnabled && !refreshing) {
            autoRefreshTimer.current = setInterval(() => {
                console.log(`Auto-refreshing data every ${autoRefreshInterval}s...`);
                isManualRefresh.current = false;
                setLastAutoRefresh(new Date());
                setRefreshCount(prev => prev + 1);
                onRefresh?.();
            }, autoRefreshInterval * 1000);
            
            return () => {
                if (autoRefreshTimer.current) {
                    clearInterval(autoRefreshTimer.current);
                }
            };
        } else if (autoRefreshTimer.current) {
            clearInterval(autoRefreshTimer.current);
            autoRefreshTimer.current = null;
        }
    }, [autoRefreshEnabled, autoRefreshInterval, refreshing, onRefresh]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (autoRefreshTimer.current) {
                clearInterval(autoRefreshTimer.current);
            }
        };
    }, []);

    // Notify parent about auto-refresh changes
    useEffect(() => {
        onAutoRefreshChange?.({
            enabled: autoRefreshEnabled,
            interval: autoRefreshInterval,
            lastRefresh: lastAutoRefresh,
            refreshCount
        });
    }, [autoRefreshEnabled, autoRefreshInterval, lastAutoRefresh, refreshCount, onAutoRefreshChange]);

    // Handlers
    const handleManualRefresh = useCallback(() => {
        isManualRefresh.current = true;
        onRefresh?.();
    }, [onRefresh]);

    const handleAutoRefreshToggle = useCallback((event) => {
        const enabled = event.target.checked;
        setAutoRefreshEnabled(enabled);
        
        if (enabled) {
            // Immediate refresh when enabling auto-refresh
            handleManualRefresh();
        } else {
            // Reset counters when disabling
            setRefreshCount(0);
            setLastAutoRefresh(null);
        }
    }, [handleManualRefresh]);

    const handleIntervalChange = useCallback(() => {
        if (customInterval >= 5 && customInterval <= 300) {
            setAutoRefreshInterval(customInterval);
            // If auto-refresh is enabled, restart with new interval
            if (autoRefreshEnabled) {
                setAutoRefreshEnabled(false);
                setTimeout(() => setAutoRefreshEnabled(true), 100);
            }
        }
    }, [customInterval, autoRefreshEnabled]);

    const formatLastRefresh = () => {
        if (!lastAutoRefresh) return '';
        const now = new Date();
        const diffMs = now - lastAutoRefresh;
        const diffSeconds = Math.floor(diffMs / 1000);
        
        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        const diffMinutes = Math.floor(diffSeconds / 60);
        return `${diffMinutes}m ago`;
    };

    const getNextRefreshCountdown = () => {
        if (!autoRefreshEnabled || !lastAutoRefresh) return autoRefreshInterval;
        
        const now = new Date();
        const timeSinceLastRefresh = Math.floor((now - lastAutoRefresh) / 1000);
        const timeUntilNext = autoRefreshInterval - timeSinceLastRefresh;
        
        return Math.max(0, timeUntilNext);
    };

    return (
        <>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 3,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 1,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                {/* Left Section - Title and Auto-refresh Status */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TitleComponent text="Volcano Dashboard" />
                    
                    {/* Auto-refresh Status Chip */}
                    {autoRefreshEnabled && (
                        <Chip
                            icon={refreshing ? <RefreshIcon /> : <PlayIcon />}
                            label={
                                refreshing 
                                    ? "Refreshing..." 
                                    : `Auto: ${getNextRefreshCountdown()}s`
                            }
                            color="primary"
                            size="small"
                            sx={{
                                '& .MuiChip-icon': {
                                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                },
                                '@keyframes spin': {
                                    '0%': { transform: 'rotate(0deg)' },
                                    '100%': { transform: 'rotate(360deg)' }
                                }
                            }}
                        />
                    )}

                    {/* Refresh Statistics */}
                    {refreshCount > 0 && (
                        <Typography variant="caption" color="text.secondary">
                            {refreshCount} auto-refreshes
                            {lastAutoRefresh && ` • Last: ${formatLastRefresh()}`}
                        </Typography>
                    )}
                </Box>

                {/* Right Section - Action Buttons */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Manual Refresh Button */}
                    <Tooltip title={refreshing ? "Refreshing..." : "Manual Refresh"}>
                        <IconButton 
                            onClick={handleManualRefresh}
                            disabled={refreshing}
                            color="primary"
                        >
                            <RefreshIcon 
                                sx={{
                                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                                    '@keyframes spin': {
                                        '0%': { transform: 'rotate(0deg)' },
                                        '100%': { transform: 'rotate(360deg)' }
                                    }
                                }}
                            />
                        </IconButton>
                    </Tooltip>

                    {/* Auto-refresh Settings */}
                    <Tooltip title="Auto-refresh Settings">
                        <IconButton 
                            onClick={(e) => setSettingsAnchor(e.currentTarget)}
                            color={autoRefreshEnabled ? "primary" : "default"}
                        >
                            <SettingsIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Auto-refresh Settings Popover */}
            <Popover
                open={Boolean(settingsAnchor)}
                anchorEl={settingsAnchor}
                onClose={() => setSettingsAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ 
                    sx: { 
                        p: 3, 
                        minWidth: 320,
                        borderRadius: 2,
                        boxShadow: 3
                    } 
                }}
            >
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ScheduleIcon />
                    Auto-refresh Settings
                </Typography>
                
                <FormControlLabel
                    control={
                        <Switch
                            checked={autoRefreshEnabled}
                            onChange={handleAutoRefreshToggle}
                            color="primary"
                        />
                    }
                    label={
                        <Box>
                            <Typography variant="body2">
                                Enable auto-refresh
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Automatically refresh dashboard data
                            </Typography>
                        </Box>
                    }
                    sx={{ mb: 2, alignItems: 'flex-start' }}
                />

                <Divider sx={{ my: 2 }} />

                {/* Interval Configuration */}
                <Typography variant="subtitle2" gutterBottom>
                    Refresh Interval
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TextField
                        size="small"
                        type="number"
                        label="Seconds"
                        value={customInterval}
                        onChange={(e) => setCustomInterval(Number(e.target.value))}
                        InputProps={{ 
                            inputProps: { min: 5, max: 300 },
                        }}
                        sx={{ width: 100 }}
                        disabled={!autoRefreshEnabled}
                    />
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleIntervalChange}
                        disabled={customInterval === autoRefreshInterval || !autoRefreshEnabled}
                    >
                        Apply
                    </Button>
                </Box>

                {/* Quick Interval Presets */}
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                    Quick presets:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[15, 30, 60, 120, 300].map((preset) => (
                        <Button
                            key={preset}
                            size="small"
                            variant={autoRefreshInterval === preset ? "contained" : "outlined"}
                            onClick={() => {
                                setCustomInterval(preset);
                                setAutoRefreshInterval(preset);
                                if (autoRefreshEnabled) {
                                    setAutoRefreshEnabled(false);
                                    setTimeout(() => setAutoRefreshEnabled(true), 100);
                                }
                            }}
                            disabled={!autoRefreshEnabled}
                            sx={{ minWidth: 'auto', px: 1 }}
                        >
                            {preset < 60 ? `${preset}s` : `${preset/60}m`}
                        </Button>
                    ))}
                </Box>

                {/* Current Status */}
                {autoRefreshEnabled && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Status: Active • Interval: {autoRefreshInterval}s
                            <br />
                            Next refresh in: {getNextRefreshCountdown()}s
                            {refreshCount > 0 && (
                                <>
                                    <br />
                                    Total auto-refreshes: {refreshCount}
                                </>
                            )}
                        </Typography>
                    </Box>
                )}
            </Popover>
        </>
    );
};

export default DashboardHeader;