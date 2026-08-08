"use client";

import {
    DndContext,
    closestCenter,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ACTION_DESCRIPTIONS,
    ACTION_NAMES,
    type ActionName,
} from "@volcano/trpc/server/router/scheduler/metadata";
import type { SchedulerConfig } from "@volcano/trpc/server/router/scheduler/schema";
import { GripVertical, Plus, X } from "lucide-react";

type ActionPipelineEditorProps = {
    actions: SchedulerConfig["actions"];
    onChange: (actions: SchedulerConfig["actions"]) => void;
};

const RECOMMENDED_ACTIONS = new Set(["enqueue", "allocate"]);

function actionDescription(action: string): string {
    return (
        (ACTION_DESCRIPTIONS as Record<string, string>)[action] ??
        "Custom action (not in the built-in registry)"
    );
}

function SortableActionItem({
    action,
    index,
    onRemove,
}: {
    action: string;
    index: number;
    onRemove: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: index });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-muted-foreground/30"
        >
            <button
                type="button"
                className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
                title="Drag to reorder"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="h-4 w-4" />
            </button>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
            </span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{action}</span>
                    {RECOMMENDED_ACTIONS.has(action) && (
                        <Badge variant="secondary" className="font-normal">
                            recommended
                        </Badge>
                    )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                    {actionDescription(action)}
                </div>
            </div>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                title="Remove action"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
    );
}

export function ActionPipelineEditor({ actions, onChange }: ActionPipelineEditorProps) {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const availableActions = ACTION_NAMES.filter((a) => !actions.includes(a));

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = Number(active.id);
        const newIndex = Number(over.id);
        if (Number.isNaN(oldIndex) || Number.isNaN(newIndex)) return;

        onChange(arrayMove([...actions], oldIndex, newIndex));
    };

    const addAction = (action: ActionName) => {
        onChange([...actions, action]);
    };

    const removeAction = (index: number) => {
        onChange(actions.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            {/* @ts-expect-error @dnd-kit/core types conflict with @types/react 18 */}
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <SortableContext
                    items={actions.map((_, i) => i)}
                    strategy={verticalListSortingStrategy}
                >
                    <div className="space-y-2">
                        {actions.length === 0 && (
                            <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                                No actions configured. Add at least one action below.
                            </p>
                        )}
                        {actions.map((action, index) => (
                            <SortableActionItem
                                key={`${action}-${index}`}
                                action={action}
                                index={index}
                                onRemove={() => removeAction(index)}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {availableActions.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Available actions</p>
                    <div className="flex flex-wrap gap-1.5">
                        {availableActions.map((action) => (
                            <Button
                                key={action}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 border-dashed font-mono text-xs text-muted-foreground hover:text-foreground"
                                title={actionDescription(action)}
                                onClick={() => addAction(action)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                {action}
                            </Button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
