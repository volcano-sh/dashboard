import React from "react";
import {
    FormControl,
    Select,
    MenuItem,
    Box,
    Typography,
    InputLabel,
} from "@mui/material";
import { useCluster } from "../config/ClusterContext";
import DnsIcon from "@mui/icons-material/Dns";

const ClusterSelector = () => {
    const { clusters, currentCluster, setCurrentCluster } = useCluster();

    const handleChange = (event) => {
        setCurrentCluster(event.target.value);
    };

    if (clusters.length <= 1) return null;

    return (
        <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>
            <DnsIcon sx={{ color: "white", mr: 1 }} />
            <FormControl
                variant="outlined"
                size="small"
                sx={{
                    minWidth: 150,
                    "& .MuiOutlinedInput-root": {
                        color: "white",
                        "& fieldset": {
                            borderColor: "rgba(255, 255, 255, 0.3)",
                        },
                        "&:hover fieldset": {
                            borderColor: "white",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "white",
                        },
                    },
                    "& .MuiSelect-icon": {
                        color: "white",
                    },
                }}
            >
                <Select
                    value={currentCluster}
                    onChange={handleChange}
                    displayEmpty
                    inputProps={{ "aria-label": "Select Cluster" }}
                >
                    {clusters.map((cluster) => (
                        <MenuItem key={cluster.name} value={cluster.name}>
                            <Typography variant="body2">
                                {cluster.name}{" "}
                                {cluster.isCurrent ? "(current)" : ""}
                            </Typography>
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
};

export default ClusterSelector;
