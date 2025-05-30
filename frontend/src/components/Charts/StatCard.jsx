import React from 'react';
import { Card, CardContent, Typography, Box, Zoom, alpha } from '@mui/material';

const StatCard = ({ title, value, subtitle, color, icon: IconComponent, colors }) => (
    <Zoom in={true} timeout={500}>
        <Card 
            sx={{ 
                height: '140px',
                bgcolor: colors.white,
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: `2px solid ${alpha(color, 0.1)}`,
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 12px 24px ${alpha(color, 0.15)}`,
                    borderColor: alpha(color, 0.3),
                },
            }}
        >
            <CardContent sx={{ 
                position: 'relative', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                p: 3
            }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" fontWeight={500} mb={1}>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight="bold" sx={{ color, mb: 0.5 }}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body2" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: alpha(color, 0.1),
                    }}>
                        <IconComponent sx={{ fontSize: 24, color }} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    </Zoom>
);

export default StatCard;