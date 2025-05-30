import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Paper, FormControl, Select, MenuItem, Fade, alpha } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

const QueueResourcesBarChart = ({ 
    queueResourceData, 
    selectedResource, 
    setSelectedResource, 
    availableResources, 
    getResourceUnit, 
    colors 
}) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.white,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 2
                }}>
                    <Typography variant="body2" fontWeight="bold" color="text.primary">{label}</Typography>
                    {payload.map((entry, index) => (
                        <Typography key={index} variant="body2" sx={{ color: entry.color }}>
                            {entry.name}: {entry.value} {getResourceUnit()}
                        </Typography>
                    ))}
                </Paper>
            );
        }
        return null;
    };

    return (
        <Fade in={true} timeout={1200}>
            <Card sx={{ 
                height: 400,
                bgcolor: colors.white,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${alpha(colors.primary, 0.1)}`
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight="bold" sx={{ color: colors.secondary }}>
                            Queue Resources
                        </Typography>
                        <FormControl size="small">
                            <Select
                                value={selectedResource}
                                onChange={(e) => setSelectedResource(e.target.value)}
                                sx={{
                                    minWidth: 140,
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderColor: alpha(colors.primary, 0.2)
                                    },
                                    '&:hover .MuiOutlinedInput-notchedOutline': {
                                        borderColor: colors.primary
                                    }
                                }}
                            >
                                {availableResources.map((resource) => (
                                    <MenuItem key={resource} value={resource}>
                                        {resource.charAt(0).toUpperCase() + resource.slice(1)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                    
                    {queueResourceData.length > 0 ? (
                        <Box>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={queueResourceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{ fontSize: 12, fill: colors.gray }}
                                    />
                                    <YAxis tick={{ fontSize: 12, fill: colors.gray }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar 
                                        dataKey="used" 
                                        fill={colors.primary}
                                        name={`Used ${getResourceUnit()}`}
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        fill={colors.success}
                                        name={`Total ${getResourceUnit()}`}
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                            
                            {/* Bar Chart Legend */}
                            <Box display="flex" justifyContent="center" gap={2} mt={2}>
                                <Chip
                                    label={`Used ${getResourceUnit()}`}
                                    sx={{
                                        bgcolor: alpha(colors.primary, 0.1),
                                        color: colors.primary,
                                        fontWeight: 500,
                                        border: `1px solid ${alpha(colors.primary, 0.2)}`
                                    }}
                                    variant="outlined"
                                />
                                <Chip
                                    label={`Total ${getResourceUnit()}`}
                                    sx={{
                                        bgcolor: alpha(colors.success, 0.1),
                                        color: colors.success,
                                        fontWeight: 500,
                                        border: `1px solid ${alpha(colors.success, 0.2)}`
                                    }}
                                    variant="outlined"
                                />
                            </Box>
                        </Box>
                    ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height={280}>
                            <Typography color="text.secondary" variant="body1">
                                No queue data available
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Fade>
    );
};

export default QueueResourcesBarChart;