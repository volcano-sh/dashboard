export interface PluginArg {
    key: string;
    value: string | number | boolean;
}

export interface Plugin {
    name: string;
    enabled: boolean;
    arguments: PluginArg[];
}

export interface Tier {
    id: string;
    plugins: Plugin[];
}

export interface SchedulerConfig {
    actions: string[];
    tiers: Tier[];
}
