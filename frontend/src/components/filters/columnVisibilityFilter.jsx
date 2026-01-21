import React from "react";
import PropTypes from "prop-types";
import {
    FormGroup,
    FormControlLabel,
    Checkbox,
    Paper,
    Typography,
    Box,
} from "@mui/material";

const ColumnVisibilityFilter = ({
    columns,
    visibleColumns,
    onColumnToggle,
}) => {
    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                minWidth: 200,
                maxHeight: 300,
                overflowY: "auto",
            }}
        >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Show/Hide Columns
            </Typography>
            <Box>
                {columns.map((column) => (
                    <FormGroup key={column.key}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={visibleColumns[column.key]}
                                    onChange={(e) =>
                                        onColumnToggle(
                                            column.key,
                                            e.target.checked,
                                        )
                                    }
                                    size="small"
                                />
                            }
                            label={column.label}
                        />
                    </FormGroup>
                ))}
            </Box>
        </Paper>
    );
};

ColumnVisibilityFilter.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        }),
    ).isRequired,
    visibleColumns: PropTypes.object.isRequired,
    onColumnToggle: PropTypes.func.isRequired,
};

export default ColumnVisibilityFilter;

