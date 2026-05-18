import React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Chip, Box, Typography, Paper, Button } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import { useTranslation } from "react-i18next";

const KNOWN_ACTIONS = [
    "enqueue",
    "allocate",
    "backfill",
    "preempt",
    "reclaim",
    "shuffle",
];

interface SortableItemProps {
    id: string;
    onDelete: () => void;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        display: "inline-flex",
        alignItems: "center",
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Chip
                label={id}
                onDelete={onDelete}
                icon={
                    <span
                        {...attributes}
                        {...listeners}
                        style={{
                            cursor: "grab",
                            display: "inline-flex",
                            alignItems: "center",
                            marginLeft: "8px",
                            marginRight: "-4px",
                        }}
                    >
                        <DragIndicatorIcon fontSize="small" />
                    </span>
                }
                color="primary"
                variant="filled"
                sx={{
                    fontWeight: 500,
                    m: 0.5,
                    boxShadow: isDragging ? 3 : 1,
                    "& .MuiChip-label": {
                        paddingLeft: "8px",
                    },
                }}
            />
        </div>
    );
};

interface ActionPipelineEditorProps {
    actions: string[];
    onChange: (newActions: string[]) => void;
}

export const ActionPipelineEditor: React.FC<ActionPipelineEditorProps> = ({
    actions,
    onChange,
}) => {
    const { t } = useTranslation();
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = actions.indexOf(String(active.id));
            const newIndex = actions.indexOf(String(over.id));
            onChange(arrayMove(actions, oldIndex, newIndex));
        }
    };

    const handleDelete = (actionToDelete: string) => {
        onChange(actions.filter((a) => a !== actionToDelete));
    };

    const handleAdd = (actionToAdd: string) => {
        if (!actions.includes(actionToAdd)) {
            onChange([...actions, actionToAdd]);
        }
    };

    const unusedActions = KNOWN_ACTIONS.filter((a) => !actions.includes(a));

    return (
        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }} elevation={1}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                {t("action_pipeline", "Action Pipeline")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t(
                    "action_pipeline_help",
                    "Drag and drop to reorder active scheduling actions, or click available actions to add them.",
                )}
            </Typography>

            <Box
                sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 1,
                    p: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                    borderRadius: 1.5,
                    minHeight: "64px",
                    bgcolor: "action.hover",
                    mb: 3,
                }}
            >
                {actions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                        {t("no_actions_selected", "No actions selected. Volcano scheduler will not schedule pods.")}
                    </Typography>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={actions}
                            strategy={horizontalListSortingStrategy}
                        >
                            {actions.map((action) => (
                                <SortableItem
                                    key={action}
                                    id={action}
                                    onDelete={() => handleDelete(action)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </Box>

            {unusedActions.length > 0 && (
                <Box>
                    <Typography
                        variant="subtitle2"
                        sx={{ mb: 1.5, fontWeight: 600 }}
                    >
                        {t("available_actions", "Available Actions:")}
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {unusedActions.map((action) => (
                            <Button
                                key={action}
                                size="small"
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => handleAdd(action)}
                                sx={{
                                    textTransform: "none",
                                    borderRadius: "16px",
                                }}
                            >
                                {action}
                            </Button>
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
};
export default ActionPipelineEditor;
