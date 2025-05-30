import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Paper, Fade, alpha } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const JobStatusPieChart = ({ jobStatusData, colors }) => {
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ 
                    p: 2, 
                    bgcolor: colors.white,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: 2
                }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ color: data.color }}>
                        {data.name}: {data.value} jobs
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Fade in={true} timeout={1000}>
            <Card sx={{ 
                height: 400,
                bgcolor: colors.white,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                border: `1px solid ${alpha(colors.primary, 0.1)}`
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: colors.secondary, textAlign: 'center' }}>
                        Job Status Distribution
                    </Typography>
                    {jobStatusData.length > 0 ? (
                        <Box display="flex" flexDirection="column" alignItems="center" height="100%">
                            <ResponsiveContainer width="100%" height={240}>
                                <PieChart>
                                    <Pie
                                        data={jobStatusData}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        innerRadius={35}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {jobStatusData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.color}
                                                stroke={colors.white}
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            
                            {/* Centered Legend */}
                            <Box display="flex" justifyContent="center" gap={2} mt={1}>
                                {jobStatusData.map((item) => (
                                    <Chip
                                        key={item.name}
                                        label={`${item.name}: ${item.value}`}
                                        sx={{
                                            bgcolor: alpha(item.color, 0.1),
                                            color: item.color,
                                            fontWeight: 500,
                                            border: `1px solid ${alpha(item.color, 0.2)}`
                                        }}
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        </Box>
                    ) : (
                        <Box display="flex" alignItems="center" justifyContent="center" height={280}>
                            <Typography color="text.secondary" variant="body1">
                                No job data available
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Fade>
    );
};

export default JobStatusPieChart;
