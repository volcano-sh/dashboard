"use client";

import { Tooltip } from "@mui/material";

export const READ_ONLY_ACTION_MESSAGE =
    "This action is disabled in Read-only mode.";

const ReadOnlyActionTooltip = ({
    children,
    readOnly = false,
    title = READ_ONLY_ACTION_MESSAGE,
}) => {
    if (!readOnly) return children;

    return (
        <Tooltip title={title}>
            <span style={{ display: "inline-flex" }}>{children}</span>
        </Tooltip>
    );
};

export default ReadOnlyActionTooltip;
