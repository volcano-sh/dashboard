import React, { useState } from "react";
import { useLanguage } from "../../../contexts/LanguageContext";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    Typography,
} from "@mui/material";
import { Button } from "react-bootstrap";
import Editor from "@monaco-editor/react";
import yaml from "js-yaml";

const primaryColor = "#E34C26";

const CreateJobDialog = ({
    open,
    onClose,
    onCreate,
    title,
}) => {
    const { lang } = useLanguage();
    const zh = lang === "zh";
    const dialogTitle = title || (zh ? "创建作业 (YAML)" : "Create Job (YAML)");
    const [yamlText, setYamlText] = useState("");
    const [error, setError] = useState("");

    const handleYamlChange = (value) => {
        setYamlText(value || "");
        setError("");
    };

    const handleSubmit = () => {
        try {
            const parsed = yaml.load(yamlText);
            if (!parsed || typeof parsed !== "object") {
                    setError(zh ? "YAML 必须描述一个对象。" : "YAML must describe an object.");
                return;
            }
            setError("");
            onCreate(parsed);
            setYamlText("");
            onClose();
        } catch (e) {
                    setError(e.message || (zh ? "YAML 格式无效。" : "Invalid YAML format."));
        }
    };

    const handleClose = () => {
        setYamlText("");
        setError("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
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
                {dialogTitle}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography sx={{ fontWeight: 500, color: "#333", mb: 1 }}>
                        {zh ? "请在下方粘贴或输入作业 YAML 配置：" : "Paste or type your Job YAML specification below:"}
                    </Typography>
                    <Editor
                        height="320px"
                        defaultLanguage="yaml"
                        value={yamlText}
                        theme="vs-dark"
                        onChange={handleYamlChange}
                        options={{
                            fontSize: 15,
                            minimap: { enabled: false },
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                        }}
                    />
                    {error && (
                        <Typography
                            sx={{
                                color: "#d32f2f",
                                fontSize: "0.98rem",
                                mt: 1.2,
                                mb: -1,
                                fontWeight: 500,
                            }}
                        >
                            {error}
                        </Typography>
                    )}
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                <Button
                    onClick={handleClose}
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
                    {zh ? "取消" : "Cancel"}
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
                    disabled={!yamlText.trim()}
                >
                    {zh ? "创建" : "Create"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateJobDialog;
