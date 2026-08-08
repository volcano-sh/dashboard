"use client";

import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { PLUGIN_NAMES } from "@volcano/trpc/server/router/scheduler/metadata";
import type { SchedulerConfig } from "@volcano/trpc/server/router/scheduler/schema";
import { ChevronDown, Plus, Trash2 } from "lucide-react";
import { PluginEditor } from "./plugin-editor";

type TierEditorProps = {
    tiers: SchedulerConfig["tiers"];
    onChange: (tiers: SchedulerConfig["tiers"]) => void;
};

export function TierEditor({ tiers, onChange }: TierEditorProps) {
    const addTier = () => {
        onChange([...tiers, { plugins: [{ name: "priority" }] }]);
    };

    const removeTier = (index: number) => {
        onChange(tiers.filter((_, i) => i !== index));
    };

    const updateTier = (index: number, tier: SchedulerConfig["tiers"][number]) => {
        const next = [...tiers];
        next[index] = tier;
        onChange(next);
    };

    return (
        <div className="space-y-3">
            {tiers.map((tier, tierIndex) => (
                <Collapsible key={tierIndex} defaultOpen>
                    <div className="rounded-lg border">
                        <div className="flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 rounded-t-lg">
                            <CollapsibleTrigger className="group flex flex-1 items-center gap-2 text-sm min-w-0 text-left">
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                                <span className="font-semibold shrink-0">
                                    Tier {tierIndex + 1}
                                </span>
                                <span className="text-xs text-muted-foreground truncate">
                                    {tierIndex === 0
                                        ? "evaluated first"
                                        : "evaluated if higher tiers pass"}
                                    {" · "}
                                    {tier.plugins.map((p) => p.name).join(", ")}
                                </span>
                            </CollapsibleTrigger>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeTier(tierIndex)}
                                disabled={tiers.length <= 1}
                                title={
                                    tiers.length > 1
                                        ? "Remove tier"
                                        : "At least one tier is required"
                                }
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <CollapsibleContent>
                            <div className="p-3 space-y-2">
                                {tier.plugins.map((plugin, pluginIndex) => (
                                    <PluginEditor
                                        key={`${tierIndex}-${pluginIndex}-${plugin.name}`}
                                        plugin={plugin}
                                        usedPluginNames={tier.plugins.map((p) => p.name)}
                                        canRemove={tier.plugins.length > 1}
                                        onChange={(updated) => {
                                            const plugins = [...tier.plugins];
                                            plugins[pluginIndex] = updated;
                                            updateTier(tierIndex, { plugins });
                                        }}
                                        onRemove={() => {
                                            updateTier(tierIndex, {
                                                plugins: tier.plugins.filter(
                                                    (_, i) => i !== pluginIndex
                                                ),
                                            });
                                        }}
                                    />
                                ))}
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-dashed text-muted-foreground"
                                    onClick={() => {
                                        const unused = PLUGIN_NAMES.find(
                                            (name) =>
                                                !tier.plugins.some((p) => p.name === name)
                                        );
                                        updateTier(tierIndex, {
                                            plugins: [
                                                ...tier.plugins,
                                                { name: unused ?? "priority" },
                                            ],
                                        });
                                    }}
                                >
                                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                                    Add plugin to tier {tierIndex + 1}
                                </Button>
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            ))}

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed text-muted-foreground"
                onClick={addTier}
            >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add tier
            </Button>
        </div>
    );
}
