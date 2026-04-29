import React from "react";
import { Box, MenuItem, TextField } from "@mui/material";

const fieldBaseSx = {
    minWidth: { xs: "100%", sm: 180 },
    "& .MuiInputBase-input, & .MuiSelect-select": {
        fontSize: 14,
    },
};

const SchedulingTableFilters = ({ fields }) => {
    const visibleFields = fields.filter(Boolean);

    if (visibleFields.length === 0) {
        return null;
    }

    return (
        <Box
            sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1.5,
                mb: 2,
            }}
        >
            {visibleFields.map((field) => {
                if (field.type === "select") {
                    const options =
                        field.options && field.options.length > 0
                            ? field.options
                            : field.value
                              ? [field.value]
                              : [""];

                    return (
                        <TextField
                            select
                            key={field.key}
                            label={field.label}
                            size="small"
                            value={field.value}
                            onChange={(event) =>
                                field.onChange(event.target.value)
                            }
                            sx={{
                                ...fieldBaseSx,
                                ...(field.sx || {}),
                            }}
                            {...(field.textFieldProps || {})}
                        >
                            {options.map((option) => (
                                <MenuItem key={option} value={option}>
                                    {option || " "}
                                </MenuItem>
                            ))}
                        </TextField>
                    );
                }

                return (
                    <TextField
                        key={field.key}
                        label={field.label}
                        placeholder={field.placeholder}
                        size="small"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                        sx={{
                            ...fieldBaseSx,
                            ...(field.sx || {}),
                        }}
                        {...(field.textFieldProps || {})}
                    />
                );
            })}
        </Box>
    );
};

export default SchedulingTableFilters;
