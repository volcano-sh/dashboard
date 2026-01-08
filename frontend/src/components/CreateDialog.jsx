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
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
} from "@mui/material";
import { Button } from "react-bootstrap";
import { Plus, Minus, ChevronDown } from "lucide-react";

const primaryColor = "#E34C26";

const CreateDialog = ({
    open,
    onClose,
    onCreate,
    title,
    resourceNameLabel,
    resourceType,
}) => {
    const [queueData, setQueueData] = useState({
        name: "",
        weight: "",
        reclaimable: true,
        guarantee: { cpu: "", memory: "", scalars: [] },
        capability: { cpu: "", memory: "", scalars: [] },
        deserved: { cpu: "", memory: "", scalars: [] },
        // Pod-specific fields
        namespace: "default",
        containerName: "my-container",
        image: "nginx:latest",
        containerPort: "80",
    });
    const [expanded, setExpanded] = useState({});
    const [errors, setErrors] = useState({});

    const isPod = resourceType === "Pod";

    const handleChange = (field) => (event) => {
        let value = event.target.value;
        if (field === "weight" || field === "containerPort") {
            value = value.replace(/\D/, "");
        }
        setQueueData((prev) => ({ ...prev, [field]: value }));
    };

    const handleCheckboxChange = (event) => {
        setQueueData((prev) => ({
            ...prev,
            reclaimable: event.target.checked,
        }));
    };

    const addScalar = (section) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                scalars: [...prev[section].scalars, { key: "", value: "" }],
            },
        }));
    };

    const removeScalar = (section, idx) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: {
                ...prev[section],
                scalars: prev[section].scalars.filter((_, i) => i !== idx),
            },
        }));
    };

    const handleScalarChange = (section, idx, field) => (event) => {
        const newScalars = [...queueData[section].scalars];
        newScalars[idx][field] = event.target.value;
        setQueueData((prev) => ({
            ...prev,
            [section]: { ...prev[section], scalars: newScalars },
        }));
    };

    const handleResourceChange = (section, key) => (event) => {
        setQueueData((prev) => ({
            ...prev,
            [section]: { ...prev[section], [key]: event.target.value },
        }));
    };

    const handleAccordionChange = (section) => (event, isExpanded) => {
        setExpanded((prev) => ({
            ...prev,
            [section]: isExpanded,
        }));
    };

    const validate = () => {
        let newErrors = {};
        if (!queueData.name.trim()) {
            newErrors.name = `${resourceType} name is required`;
        }

        if (isPod) {
            if (!queueData.containerName.trim()) {
                newErrors.containerName = "Container name is required";
            }
            if (!queueData.image.trim()) {
                newErrors.image = "Container image is required";
            }
            if (
                !queueData.containerPort ||
                isNaN(queueData.containerPort) ||
                parseInt(queueData.containerPort) < 1
            ) {
                newErrors.containerPort =
                    "Container port is required and must be positive";
            }
        } else {
            // Queue validation
            if (
                !queueData.weight ||
                isNaN(queueData.weight) ||
                parseInt(queueData.weight) < 1
            ) {
                newErrors.weight = "Weight is required and must be positive";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createPodResource = () => {
        const podSpec = {
            containers: [
                {
                    name: queueData.containerName.trim(),
                    image: queueData.image.trim(),
                    ports: [
                        {
                            containerPort: parseInt(
                                queueData.containerPort,
                                10,
                            ),
                        },
                    ],
                },
            ],
        };

        return {
            apiVersion: "v1",
            kind: "Pod",
            metadata: {
                name: queueData.name.trim(),
                namespace: queueData.namespace.trim(),
            },
            spec: podSpec,
        };
    };

    const createQueueResource = () => {
        const specSection = {
            weight: parseInt(queueData.weight, 10),
            reclaimable: queueData.reclaimable,
        };

        // Handle guarantee (must be nested under resource)
        const guaranteeCpu = queueData.guarantee.cpu.trim();
        const guaranteeMemory = queueData.guarantee.memory.trim();
        const guaranteeScalars = queueData.guarantee.scalars || [];
        const hasGuaranteeStandard = guaranteeCpu || guaranteeMemory;
        const hasGuaranteeScalars = guaranteeScalars.some(
            ({ key, value }) => key.trim() && value.trim(),
        );
        if (hasGuaranteeStandard || hasGuaranteeScalars) {
            specSection.guarantee = { resource: {} };
            if (guaranteeCpu) specSection.guarantee.resource.cpu = guaranteeCpu;
            if (guaranteeMemory)
                specSection.guarantee.resource.memory = guaranteeMemory;
            guaranteeScalars.forEach(({ key, value }) => {
                if (key.trim() && value.trim()) {
                    specSection.guarantee.resource[key.trim()] = value.trim();
                }
            });
        }

        // Handle capability (flattened, not under resource)
        const capabilityCpu = queueData.capability.cpu.trim();
        const capabilityMemory = queueData.capability.memory.trim();
        const capabilityScalars = queueData.capability.scalars || [];
        const hasCapabilityStandard = capabilityCpu || capabilityMemory;
        const hasCapabilityScalars = capabilityScalars.some(
            ({ key, value }) => key.trim() && value.trim(),
        );
        if (hasCapabilityStandard || hasCapabilityScalars) {
            specSection.capability = {};
            if (capabilityCpu) specSection.capability.cpu = capabilityCpu;
            if (capabilityMemory)
                specSection.capability.memory = capabilityMemory;
            capabilityScalars.forEach(({ key, value }) => {
                if (key.trim() && value.trim()) {
                    specSection.capability[key.trim()] = value.trim();
                }
            });
        }

        // Handle deserved (flattened, not under resource)
        const deservedCpu = queueData.deserved.cpu.trim();
        const deservedMemory = queueData.deserved.memory.trim();
        const deservedScalars = queueData.deserved.scalars || [];
        const hasDeservedStandard = deservedCpu || deservedMemory;
        const hasDeservedScalars = deservedScalars.some(
            ({ key, value }) => key.trim() && value.trim(),
        );
        if (hasDeservedStandard || hasDeservedScalars) {
            specSection.deserved = {};
            if (deservedCpu) specSection.deserved.cpu = deservedCpu;
            if (deservedMemory) specSection.deserved.memory = deservedMemory;
            deservedScalars.forEach(({ key, value }) => {
                if (key.trim() && value.trim()) {
                    specSection.deserved[key.trim()] = value.trim();
                }
            });
        }

        return {
            apiVersion: "scheduling.volcano.sh/v1beta1",
            kind: resourceType,
            metadata: { name: queueData.name.trim() },
            spec: specSection,
        };
    };

    const handleSubmit = () => {
        if (!validate()) return;

        let newResource;
        if (isPod) {
            newResource = createPodResource();
        } else {
            newResource = createQueueResource();
        }

        onCreate(newResource);

        // Reset form
        setQueueData({
            name: "",
            weight: "",
            reclaimable: false,
            guarantee: { cpu: "", memory: "", scalars: [] },
            capability: { cpu: "", memory: "", scalars: [] },
            deserved: { cpu: "", memory: "", scalars: [] },
            namespace: "default",
            containerName: "my-container",
            image: "nginx:latest",
            containerPort: "80",
        });
        setExpanded({});
        setErrors({});
        onClose();
    };

    const tfStyle = {
        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
                borderColor: primaryColor,
            },
        "& .MuiInputLabel-root.Mui-focused": { color: primaryColor },
    };

    const renderResourceSection = (section) => (
        <Accordion
            key={section}
            expanded={!!expanded[section]}
            onChange={handleAccordionChange(section)}
            sx={{
                boxShadow: "none",
                border: "1px solid #ececec",
                mb: 1.5,
                "& .MuiAccordionSummary-root": { minHeight: 0 },
                "& .MuiAccordionSummary-content": {
                    color: "#555",
                    fontWeight: 500,
                },
            }}
        >
            <AccordionSummary
                expandIcon={<ChevronDown size={18} color="#888" />}
            >
                <Typography sx={{ fontWeight: 500 }}>
                    {section.charAt(0).toUpperCase() + section.slice(1)}{" "}
                    Resources (Optional)
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
                    <TextField
                        label="CPU"
                        value={queueData[section].cpu}
                        onChange={handleResourceChange(section, "cpu")}
                        fullWidth
                        placeholder="e.g. 1000m"
                        sx={tfStyle}
                    />
                    <TextField
                        label="Memory"
                        value={queueData[section].memory}
                        onChange={handleResourceChange(section, "memory")}
                        fullWidth
                        placeholder="e.g. 1Gi"
                        sx={tfStyle}
                    />
                </Box>
                <Box sx={{ ml: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                        <Box
                            sx={{
                                fontWeight: 500,
                                color: "#666",
                                flexGrow: 2,
                                fontSize: "0.9rem",
                            }}
                        >
                            Custom Scalar Resources
                        </Box>
                        <IconButton
                            size="small"
                            onClick={() => addScalar(section)}
                            sx={{
                                color: primaryColor,
                                bgcolor: "white",
                                "&:hover": {
                                    bgcolor: "#f7f7f7",
                                    color: primaryColor,
                                },
                            }}
                        >
                            <Plus size={18} />
                        </IconButton>
                    </Box>
                    {queueData[section].scalars.map((scalar, idx) => (
                        <Box
                            key={idx}
                            sx={{
                                display: "flex",
                                gap: 2,
                                mb: 1,
                                alignItems: "center",
                            }}
                        >
                            <TextField
                                label="Key"
                                value={scalar.key}
                                onChange={handleScalarChange(
                                    section,
                                    idx,
                                    "key",
                                )}
                                fullWidth
                                placeholder="e.g. nvidia.com/gpu"
                                sx={tfStyle}
                                size="small"
                            />
                            <TextField
                                label="Value"
                                value={scalar.value}
                                onChange={handleScalarChange(
                                    section,
                                    idx,
                                    "value",
                                )}
                                fullWidth
                                placeholder="e.g. 1"
                                sx={tfStyle}
                                size="small"
                            />
                            <IconButton
                                size="small"
                                onClick={() => removeScalar(section, idx)}
                                sx={{
                                    color: "#fff",
                                    bgcolor: "#dc3545",
                                    "&:hover": {
                                        bgcolor: "#c82333",
                                        color: "#fff",
                                    },
                                    ml: 1,
                                }}
                            >
                                <Minus size={16} />
                            </IconButton>
                        </Box>
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );

    const renderPodFields = () => (
        <>
            <TextField
                label="Namespace"
                value={queueData.namespace}
                onChange={handleChange("namespace")}
                fullWidth
                sx={tfStyle}
                placeholder="default"
            />
            <TextField
                required
                label="Container Name"
                value={queueData.containerName}
                onChange={handleChange("containerName")}
                fullWidth
                sx={tfStyle}
                error={!!errors.containerName}
                helperText={errors.containerName}
                placeholder="my-container"
            />
            <TextField
                required
                label="Container Image"
                value={queueData.image}
                onChange={handleChange("image")}
                fullWidth
                sx={tfStyle}
                error={!!errors.image}
                helperText={errors.image}
                placeholder="nginx:latest"
            />
            <TextField
                required
                label="Container Port"
                type="number"
                value={queueData.containerPort}
                onChange={handleChange("containerPort")}
                fullWidth
                sx={tfStyle}
                error={!!errors.containerPort}
                helperText={errors.containerPort}
                inputProps={{ min: 1 }}
                placeholder="80"
            />
        </>
    );

    const renderQueueFields = () => (
        <>
            <TextField
                label="Weight *"
                type="number"
                value={queueData.weight}
                onChange={handleChange("weight")}
                fullWidth
                sx={tfStyle}
                error={!!errors.weight}
                helperText={errors.weight}
                inputProps={{ min: 1 }}
            />
            <FormControlLabel
                control={
                    <Checkbox
                        checked={queueData.reclaimable}
                        onChange={handleCheckboxChange}
                        sx={{
                            color: primaryColor,
                            "&.Mui-checked": { color: primaryColor },
                        }}
                    />
                }
                label="Reclaimable"
                sx={{
                    ".MuiTypography-root": {
                        fontWeight: 500,
                        color: "#222",
                    },
                }}
            />
            {errors.reclaimable && (
                <Typography color="error" sx={{ ml: 1, fontSize: 13 }}>
                    {errors.reclaimable}
                </Typography>
            )}
            {["guarantee", "capability", "deserved"].map(renderResourceSection)}
        </>
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                style: {
                    borderRadius: "14px",
                    boxShadow: "0 10px 32px rgba(227,76,38,0.16)",
                },
            }}
        >
            <DialogTitle
                sx={{
                    color: primaryColor,
                    fontWeight: 700,
                    fontSize: "1.6rem",
                    pb: 1,
                    letterSpacing: "0.5px",
                }}
            >
                {title}
            </DialogTitle>
            <DialogContent>
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                        mt: 1,
                    }}
                >
                    <TextField
                        required
                        label={resourceNameLabel}
                        value={queueData.name}
                        onChange={handleChange("name")}
                        fullWidth
                        sx={tfStyle}
                        error={!!errors.name}
                        helperText={errors.name}
                    />

                    {isPod ? renderPodFields() : renderQueueFields()}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <Button
                    onClick={onClose}
                    style={{
                        backgroundColor: "#f4f4f4",
                        color: primaryColor,
                        border: "1.5px solid " + primaryColor,
                        fontWeight: 600,
                        borderRadius: 7,
                        minWidth: 110,
                        transition: "all 0.2s",
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleSubmit}
                    style={{
                        backgroundColor: primaryColor,
                        color: "#fff",
                        border: "none",
                        fontWeight: 600,
                        borderRadius: 7,
                        minWidth: 110,
                        boxShadow: "0 3px 10px 0 rgba(227,76,38,0.14)",
                        transition: "all 0.2s",
                    }}
                >
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateDialog;
