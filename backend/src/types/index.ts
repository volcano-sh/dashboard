import { components as components_job } from "./job";
import { components as components_queue } from "./queue";

export type IJob = Omit<components_job["schemas"]["Job"], "metadata"> & {
    metadata?: Record<string, string>;
    status: string;
};
export type IQueue = Omit<components_queue["schemas"]["Queue"], "metadata"> & {
    metadata?: Record<string, string>;
};
