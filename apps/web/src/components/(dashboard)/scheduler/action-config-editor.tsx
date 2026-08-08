"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { SchedulerConfig } from "@volcano/trpc/server/router/scheduler/schema";
import { Plus, Trash2 } from "lucide-react";

type ActionConfigEditorProps = {
    configurations: NonNullable<SchedulerConfig["configurations"]>;
    actions: SchedulerConfig["actions"];
    onChange: (configurations: NonNullable<SchedulerConfig["configurations"]>) => void;
};

export function ActionConfigEditor({
    configurations,
    actions,
    onChange,
}: ActionConfigEditorProps) {
    const addConfiguration = () => {
        const unusedAction = actions.find(
            (action) => !configurations.some((c) => c.name === action)
        );
        if (!unusedAction) return;
        onChange([
            ...configurations,
            { name: unusedAction, arguments: {} },
        ]);
    };

    const updateConfiguration = (
        index: number,
        config: NonNullable<SchedulerConfig["configurations"]>[number]
    ) => {
        const next = [...configurations];
        next[index] = config;
        onChange(next);
    };

    const removeConfiguration = (index: number) => {
        onChange(configurations.filter((_, i) => i !== index));
    };

    const availableActions = actions.filter(
        (action) => !configurations.some((c) => c.name === action)
    );

    return (
        <div className="space-y-3">
            {configurations.length === 0 && (
                <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                    No per-action arguments configured.
                </p>
            )}

            {configurations.map((config, index) => (
                <div key={`${config.name}-${index}`} className="rounded-lg border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-xs space-y-1">
                            <Label className="text-xs text-muted-foreground">Action</Label>
                            <Select
                                value={config.name}
                                onValueChange={(name) =>
                                    updateConfiguration(index, {
                                        ...config,
                                        name,
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {actions.map((action) => (
                                        <SelectItem
                                            key={action}
                                            value={action}
                                            disabled={
                                                action !== config.name &&
                                                configurations.some((c) => c.name === action)
                                            }
                                        >
                                            {action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-5 ml-auto text-muted-foreground hover:text-destructive"
                            onClick={() => removeConfiguration(index)}
                            title="Remove action configuration"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Arguments (key=value)</Label>
                        {Object.entries(config.arguments).map(([key, value], argIndex) => (
                            <div key={argIndex} className="flex items-center gap-2">
                                <Input
                                    className="flex-1"
                                    value={key}
                                    onChange={(e) => {
                                        const newKey = e.target.value;
                                        if (
                                            newKey !== key &&
                                            Object.prototype.hasOwnProperty.call(
                                                config.arguments,
                                                newKey
                                            )
                                        ) {
                                            return;
                                        }
                                        const nextArgs: Record<string, typeof value> = {};
                                        for (const [k, v] of Object.entries(config.arguments)) {
                                            if (k === key) {
                                                nextArgs[newKey] = value;
                                            } else {
                                                nextArgs[k] = v;
                                            }
                                        }
                                        updateConfiguration(index, {
                                            ...config,
                                            arguments: nextArgs,
                                        });
                                    }}
                                    placeholder="key"
                                />
                                <Input
                                    className="flex-1"
                                    value={String(value)}
                                    onChange={(e) =>
                                        updateConfiguration(index, {
                                            ...config,
                                            arguments: {
                                                ...config.arguments,
                                                [key]: e.target.value,
                                            },
                                        })
                                    }
                                    placeholder="value"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                    onClick={() => {
                                        const nextArgs = { ...config.arguments };
                                        delete nextArgs[key];
                                        updateConfiguration(index, {
                                            ...config,
                                            arguments: nextArgs,
                                        });
                                    }}
                                    title="Delete argument"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={Object.keys(config.arguments).some((k) => !k.trim())}
                            onClick={() =>
                                updateConfiguration(index, {
                                    ...config,
                                    arguments: {
                                        ...config.arguments,
                                        "": "",
                                    },
                                })
                            }
                        >
                            Add argument
                        </Button>
                        {Object.keys(config.arguments).some((k) => !k.trim()) && (
                            <p className="text-xs text-amber-600">
                                Fill in the argument key before adding another or saving.
                            </p>
                        )}
                    </div>
                </div>
            ))}

            {availableActions.length > 0 && (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed text-muted-foreground"
                    onClick={addConfiguration}
                >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add action configuration
                </Button>
            )}
        </div>
    );
}
