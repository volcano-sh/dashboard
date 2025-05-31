import React from 'react';
import PropTypes from 'prop-types';
import {
    TableRow,
    TableCell,
    Typography,
    Box,
    IconButton,
} from '@mui/material';

PodRow.propTypes = {
    pod: PropTypes.shape({
        metadata: PropTypes.shape({
            name: PropTypes.string.isRequired,
            namespace: PropTypes.string.isRequired,
            creationTimestamp: PropTypes.string.isRequired,
        }).isRequired,
        status: PropTypes.shape({
            phase: PropTypes.string,
            resourceUsage: PropTypes.shape({
                cpu: PropTypes.number,
                memory: PropTypes.number,
            }),
        }),
        spec: PropTypes.shape({
            containers: PropTypes.arrayOf(
                PropTypes.shape({
                    resources: PropTypes.shape({
                        limits: PropTypes.shape({
                            cpu: PropTypes.number,
                            memory: PropTypes.number,
                        }),
                    }),
                }),
            ),
        }),
    }).isRequired,
    getStatusColor: PropTypes.func.isRequired,
    onPodClick: PropTypes.func.isRequired,
    onDelete: PropTypes.func,
    onRefresh: PropTypes.func,
    onEdit: PropTypes.func,
    visibleColumns: PropTypes.object.isRequired,
    columns: PropTypes.object.isRequired,
    isSelected: PropTypes.bool.isRequired,
    onSelect: PropTypes.func.isRequired,
};
