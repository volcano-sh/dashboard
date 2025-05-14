import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    FormControlLabel,
    Checkbox,
} from "@mui/material";
import { Button } from "react-bootstrap";

const CreateQueueDialog = ({ open, onClose, onCreate }) => {
    const [queueData, setQueueData] = useState({
        name: "",
        namespace: "",
        weight: 1,
        reclaimable: true,
        guaranteed: { cpu: "", memory: "" },
        capability: { cpu: "", memory: "" },
        deserved: { cpu: "", memory: "" },
    });

    const primaryColor = "#E34C26";

    const handleChange = (field) => (event) => {
        setQueueData((prev) => ({
            ...prev,
            [field]:
                field === "weight"
                    ? parseInt(event.target.value)
                    : event.target.value,
        }));
    };

    const handleResourceChange = (section, key) => (event) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: event.target.value,
            },
        }));
    };

    const handleCheckboxChange = (event) => {
        setQueueData((prev) => ({
            ...prev,
            reclaimable: event.target.checked,
        }));
    };

    const handleSubmit = () => {
        if (!queueData.name.trim()) {
            alert("Queue name is required.");
            return;
        }

        const specSection = {
            weight: queueData.weight,
            reclaimable: queueData.reclaimable,
            guaranteed: {},
            capability: {},
            deserved: {},
        };

        // Add non-empty fields only
        ["guaranteed", "capability", "deserved"].forEach((section) => {
            const cpu = queueData[section].cpu.trim();
            const memory = queueData[section].memory.trim();
            if (cpu || memory) {
                specSection[section] = {};
                if (cpu) specSection[section].cpu = cpu;
                if (memory) specSection[section].memory = memory;
            } else {
                delete specSection[section]; // omit empty section
            }
        });

        const newQueue = {
            apiVersion: "scheduling.volcano.sh/v1beta1",
            kind: "Queue",
            metadata: {
                name: queueData.name.trim(),
            },
            spec: specSection,
        };

        if (queueData.namespace.trim()) {
            newQueue.metadata.namespace = queueData.namespace.trim();
        }

        onCreate(newQueue);
        setQueueData({
            name: "",
            namespace: "",
            weight: 1,
            reclaimable: true,
            guaranteed: { cpu: "", memory: "" },
            capability: { cpu: "", memory: "" },
            deserved: { cpu: "", memory: "" },
        });
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                style: {
                    borderRadius: "12px",
                    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
                },
            }}
        >
            <DialogTitle
                sx={{ color: "#212529", fontWeight: 500, paddingBottom: 1 }}
            >
                Create Queue
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        mt: 1,
                    }}
                >
                    <TextField
                        required
                        label="Queue Name"
                        value={queueData.name}
                        onChange={handleChange("name")}
                        fullWidth
                        sx={{
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                    borderColor: primaryColor,
                                },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: primaryColor,
                            },
                        }}
                    />
                    <TextField
                        label="Namespace (optional)"
                        value={queueData.namespace}
                        onChange={handleChange("namespace")}
                        fullWidth
                        sx={{
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                    borderColor: primaryColor,
                                },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: primaryColor,
                            },
                        }}
                    />
                    <TextField
                        label="Weight"
                        type="number"
                        value={queueData.weight}
                        onChange={handleChange("weight")}
                        fullWidth
                        sx={{
                            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                    borderColor: primaryColor,
                                },
                            "& .MuiInputLabel-root.Mui-focused": {
                                color: primaryColor,
                            },
                        }}
                    />
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={queueData.reclaimable}
                                onChange={handleCheckboxChange}
                                sx={{
                                    color: primaryColor,
                                    "&.Mui-checked": {
                                        color: primaryColor,
                                    },
                                }}
                            />
                        }
                        label="Reclaimable"
                    />

                    {/* Sections for guaranteed, capability, deserved */}
                    {["guaranteed", "capability", "deserved"].map((section) => (
                        <Box key={section}>
                            <Box sx={{ fontWeight: 500, mb: 1, color: "#555" }}>
                                {section.charAt(0).toUpperCase() +
                                    section.slice(1)}{" "}
                                Resources
                            </Box>
                            <Box sx={{ display: "flex", gap: 2 }}>
                                <TextField
                                    label="CPU"
                                    value={queueData[section].cpu}
                                    onChange={handleResourceChange(
                                        section,
                                        "cpu",
                                    )}
                                    fullWidth
                                    placeholder="e.g. 1000m"
                                    sx={{
                                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                            {
                                                borderColor: primaryColor,
                                            },
                                        "& .MuiInputLabel-root.Mui-focused": {
                                            color: primaryColor,
                                        },
                                    }}
                                />
                                <TextField
                                    label="Memory"
                                    value={queueData[section].memory}
                                    onChange={handleResourceChange(
                                        section,
                                        "memory",
                                    )}
                                    fullWidth
                                    placeholder="e.g. 1Gi"
                                    sx={{
                                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                            {
                                                borderColor: primaryColor,
                                            },
                                        "& .MuiInputLabel-root.Mui-focused": {
                                            color: primaryColor,
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onClose}
                    style={{ backgroundColor: "#E34C26", color: "white" }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    style={{ backgroundColor: "#E34C26", color: "white" }}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateQueueDialog;
