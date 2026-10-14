"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getPluginArgumentSchema,
    getPluginEnableFlags,
    isKnownPlugin,
    PLUGIN_ENABLE_FLAG_LABELS,
    PLUGIN_NAMES,
    type PluginEnableFlagKey,
} from "@volcano/trpc/server/router/scheduler/metadata";
import type { PluginOption } from "@volcano/trpc/server/router/scheduler/schema";
import { ChevronRight, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";

type PluginEditorProps = {
    plugin: PluginOption;
    usedPluginNames: string[];
    canRemove: boolean;
    onChange: (plugin: PluginOption) => void;
    onRemove: () => void;
};

function setEnableFlag(
    plugin: PluginOption,
    key: PluginEnableFlagKey,
    value: boolean | undefined
): PluginOption {
    const next = { ...plugin };
    if (value === undefined) {
        delete next[key];
    } else {
        next[key] = value;
    }
    return next;
}

function setArgument(
    plugin: PluginOption,
    key: string,
    value: string | number | boolean | undefined
): PluginOption {
    const args = { ...(plugin.arguments ?? {}) };
    if (value === undefined || value === "") {
        delete args[key];
    } else {
        args[key] = value;
    }
    return {
        ...plugin,
        arguments: Object.keys(args).length > 0 ? args : undefined,
    };
}

export function PluginEditor({
    plugin,
    usedPluginNames,
    canRemove,
    onChange,
    onRemove,
}: PluginEditorProps) {
    const t = useTranslations("scheduler");
    const enableFlags = getPluginEnableFlags(plugin.name);
    const argumentSchema = getPluginArgumentSchema(plugin.name);
    const customArgumentKeys = Object.keys(plugin.arguments ?? {}).filter(
        (key) => !argumentSchema.some((field) => field.key === key)
    );

    const disabledFlags = enableFlags.filter((flag) => plugin[flag] === false);
    const argCount = Object.keys(plugin.arguments ?? {}).length;
    const isCustom = !isKnownPlugin(plugin.name);

    const selectablePlugins: string[] = isCustom
        ? [plugin.name, ...PLUGIN_NAMES]
        : [...PLUGIN_NAMES];

    const flagLabel = (flag: PluginEnableFlagKey) => {
        const key = `enableFlags.${flag}` as const;
        return t.has(key) ? t(key) : PLUGIN_ENABLE_FLAG_LABELS[flag];
    };

    const argumentLabel = (field: { key: string; label: string }) => {
        const key = `argumentLabels.${field.key}`;
        return t.has(key as "argumentLabels.weight")
            ? t(key as "argumentLabels.weight")
            : field.label;
    };

    return (
        <Collapsible>
            <div className="rounded-lg border bg-background transition-colors hover:border-muted-foreground/30">
                <div className="flex items-center gap-1 pr-1">
                    <CollapsibleTrigger className="group flex flex-1 items-center gap-2 px-3 py-2.5 text-left min-w-0">
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                        <span className="font-mono text-sm font-medium truncate">
                            {plugin.name}
                        </span>
                        <span className="flex items-center gap-1.5 ml-auto shrink-0">
                            {isCustom && (
                                <Badge variant="outline" className="font-normal">
                                    {t("plugin.custom")}
                                </Badge>
                            )}
                            {disabledFlags.length > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="font-normal text-amber-700 dark:text-amber-400"
                                >
                                    {t("plugin.functionsOff", { count: disabledFlags.length })}
                                </Badge>
                            )}
                            {argCount > 0 && (
                                <Badge variant="secondary" className="font-normal">
                                    {t("plugin.argsCount", { count: argCount })}
                                </Badge>
                            )}
                        </span>
                    </CollapsibleTrigger>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={onRemove}
                        disabled={!canRemove}
                        title={
                            canRemove
                                ? t("plugin.removePlugin")
                                : t("plugin.removePluginDisabled")
                        }
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>

                <CollapsibleContent>
                    <div className="border-t px-3 py-3 space-y-4">
                        <div className="max-w-xs space-y-1">
                            <Label className="text-xs text-muted-foreground">
                                {t("plugin.label")}
                            </Label>
                            <Select
                                value={plugin.name}
                                onValueChange={(name) =>
                                    // Flags and arguments are plugin-specific; both reset on rename.
                                    onChange({ name })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectablePlugins.map((name) => (
                                        <SelectItem
                                            key={name}
                                            value={name}
                                            disabled={
                                                name !== plugin.name &&
                                                usedPluginNames.includes(name)
                                            }
                                        >
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {enableFlags.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    {t("plugin.sessionFunctions")}
                                    <span className="font-normal">
                                        {" "}
                                        — {t("plugin.sessionFunctionsHint")}
                                    </span>
                                </Label>
                                <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {enableFlags.map((flag) => {
                                        const checked = plugin[flag];
                                        const isSet = typeof checked === "boolean";
                                        return (
                                            <div
                                                key={flag}
                                                className="flex items-center gap-2"
                                            >
                                                <Checkbox
                                                    id={`${plugin.name}-${flag}`}
                                                    checked={isSet ? checked : true}
                                                    onCheckedChange={(value) => {
                                                        if (value === "indeterminate") return;
                                                        onChange(
                                                            setEnableFlag(
                                                                plugin,
                                                                flag,
                                                                value ? true : false
                                                            )
                                                        );
                                                    }}
                                                />
                                                <Label
                                                    htmlFor={`${plugin.name}-${flag}`}
                                                    className="text-sm font-normal cursor-pointer"
                                                >
                                                    {flagLabel(flag)}
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(argumentSchema.length > 0 || customArgumentKeys.length > 0) && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    {t("plugin.arguments")}
                                </Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {argumentSchema.map((field) => (
                                        <div key={field.key} className="space-y-1">
                                            {field.type === "boolean" ? (
                                                <div className="flex items-center gap-2 pt-5">
                                                    <Checkbox
                                                        id={`${plugin.name}-arg-${field.key}`}
                                                        checked={Boolean(
                                                            plugin.arguments?.[field.key]
                                                        )}
                                                        onCheckedChange={(value) =>
                                                            onChange(
                                                                setArgument(
                                                                    plugin,
                                                                    field.key,
                                                                    value === true
                                                                )
                                                            )
                                                        }
                                                    />
                                                    <Label
                                                        htmlFor={`${plugin.name}-arg-${field.key}`}
                                                        className="text-sm font-normal cursor-pointer"
                                                    >
                                                        {argumentLabel(field)}
                                                    </Label>
                                                </div>
                                            ) : (
                                                <>
                                                    <Label className="text-xs">
                                                        {argumentLabel(field)}
                                                    </Label>
                                                    <Input
                                                        type={
                                                            field.type === "number"
                                                                ? "number"
                                                                : "text"
                                                        }
                                                        value={String(
                                                            plugin.arguments?.[field.key] ?? ""
                                                        )}
                                                        onChange={(e) => {
                                                            const raw = e.target.value;
                                                            let parsed:
                                                                | string
                                                                | number
                                                                | undefined = raw;
                                                            if (field.type === "number") {
                                                                if (raw === "") {
                                                                    parsed = undefined;
                                                                } else {
                                                                    const n = Number(raw);
                                                                    parsed = Number.isFinite(n)
                                                                        ? n
                                                                        : undefined;
                                                                }
                                                            }
                                                            onChange(
                                                                setArgument(
                                                                    plugin,
                                                                    field.key,
                                                                    parsed
                                                                )
                                                            );
                                                        }}
                                                        placeholder={field.key}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                    {customArgumentKeys.map((key) => (
                                        <div key={key} className="space-y-1">
                                            <Label className="text-xs font-mono">{key}</Label>
                                            <Input
                                                value={String(plugin.arguments?.[key] ?? "")}
                                                onChange={(e) =>
                                                    onChange(
                                                        setArgument(plugin, key, e.target.value)
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CollapsibleContent>
            </div>
        </Collapsible>
    );
}
