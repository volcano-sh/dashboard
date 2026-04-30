import React from "react";
import {
    ResourceStatusBars,
    ResourceStatusDetailBar,
} from "../scheduling/ResourceStatus";
import {
    getQueueResourceDetail,
    getQueueResourceStatusItems,
} from "./queueResourceUsage";

export const QueueResourceUsageBars = ({ queue }) => (
    <ResourceStatusBars resources={getQueueResourceStatusItems(queue)} />
);

export const QueueResourceUsageDetailBar = ({ mode, queue, resource }) => {
    const detail = getQueueResourceDetail(queue, resource, mode);

    return (
        <ResourceStatusDetailBar
            resource={detail.resource}
            scaleLabels={detail.scaleLabels}
            stats={detail.stats}
            valueText={detail.valueText}
        />
    );
};
