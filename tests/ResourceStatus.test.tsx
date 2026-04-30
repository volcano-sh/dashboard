import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ResourceStatusCompactBars } from "../components/scheduling/ResourceStatus";
import { getQueueResourceStatusItems } from "../components/queues/queueResourceUsage";

const queue = {
    spec: {
        capability: {
            cpu: "8",
            memory: "1Ti",
            pods: "10",
        },
    },
    summary: {
        schedulerMetrics: {
            cpu: {
                allocatedMilli: 3000,
                deservedMilli: 4000,
                requestedMilli: 2000,
            },
            memory: {
                allocatedBytes: 256 * 1024 * 1024,
                deservedBytes: 512 * 1024 * 1024,
                requestedBytes: 128 * 1024 * 1024,
            },
            scalar: {
                pods: {
                    allocated: 1,
                    deserved: 2,
                    requested: 1,
                },
            },
        },
    },
};

describe("ResourceStatusCompactBars", () => {
    it("renders compact CPU, memory, and pods scheduler resource bars", () => {
        render(
            <ResourceStatusCompactBars
                resources={getQueueResourceStatusItems(queue)}
            />,
        );

        expect(screen.getByText("CPU")).toBeInTheDocument();
        expect(screen.getByText("Memory")).toBeInTheDocument();
        expect(screen.getByText("Pods")).toBeInTheDocument();
        expect(screen.getByText("75%")).toBeInTheDocument();
        expect(screen.getAllByText("50%")).toHaveLength(2);
    });

    it("uses the shared resource tooltip copy", async () => {
        render(
            <ResourceStatusCompactBars
                resources={getQueueResourceStatusItems(queue)}
            />,
        );

        fireEvent.mouseOver(screen.getByText("CPU"));

        expect(
            await screen.findByText(/Allocated \/ deserved: 75%/),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Source: \/api\/v1\/queues summary.schedulerMetrics/),
        ).toBeInTheDocument();
    });
});
