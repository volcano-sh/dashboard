// CreateQueueDialog.js
import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    MenuItem,
} from "@mui/material";
import { Button } from "react-bootstrap";

const CreateQueueDialog = ({ open, onClose, onCreate }) => {
    const [queueData, setQueueData] = useState({
        name: "",
        weight: 1,
        state: "Open",
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

    const handleSubmit = () => {
        if (!queueData.name.trim()) {
            alert("Queue name is required.");
            return;
        }

        const newQueue = {
            apiVersion: "scheduling.volcano.sh/v1beta1",
            kind: "Queue",
            metadata: {
                name: queueData.name.trim(),
            },
            spec: {
                weight: queueData.weight,
                state: queueData.state,
            },
        };

        onCreate(newQueue);
        setQueueData({ name: "", weight: 1, state: "Open" });
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
                    <TextField
                        select
                        label="State"
                        value={queueData.state}
                        onChange={handleChange("state")}
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
                    >
                        <MenuItem value="Open">Open</MenuItem>
                        <MenuItem value="Closed">Closed</MenuItem>
                    </TextField>
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
