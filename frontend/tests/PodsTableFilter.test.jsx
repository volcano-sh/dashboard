import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PodsTable from "../src/components/pods/PodsTable/PodsTable";

const theme = createTheme();

const mockPods = [
    {
        metadata: {
            name: "pod-a",
            namespace: "default",
            creationTimestamp: new Date().toISOString(),
        },
        status: { phase: "Running" },
        spec: {},
    },
    {
        metadata: {
            name: "pod-b",
            namespace: "kube-system",
            creationTimestamp: new Date().toISOString(),
        },
        status: { phase: "Pending" },
        spec: {},
    },
];

const renderTable = (onFilterChange) =>
    render(
        <ThemeProvider theme={theme}>
            <PodsTable
                pods={mockPods}
                filters={{ status: "All", namespace: "default" }}
                allNamespaces={["default", "kube-system"]}
                sortDirection="desc"
                onSortDirectionToggle={() => {}}
                onFilterChange={onFilterChange}
                onPodClick={() => {}}
            />
        </ThemeProvider>,
    );

describe("PodsTable filter", () => {
    it("calls onFilterChange with the selected value when an item is clicked", () => {
        const onFilterChange = vi.fn();
        renderTable(onFilterChange);

        const statusFilterBtn = screen.getByRole("button", {
            name: /filter: all/i,
        });
        fireEvent.click(statusFilterBtn);

        const runningOption = screen.getByText("Running");
        fireEvent.click(runningOption);

        expect(onFilterChange).toHaveBeenCalledWith("status", "Running");
        expect(onFilterChange).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onFilterChange when the menu is dismissed without a selection", () => {
        const onFilterChange = vi.fn();
        renderTable(onFilterChange);

        const statusFilterBtn = screen.getByRole("button", {
            name: /filter: all/i,
        });
        fireEvent.click(statusFilterBtn);

        // Simulate MUI Menu calling onClose with no selected value (dismiss)
        const menu = document.querySelector('[role="presentation"]');
        if (menu) {
            fireEvent.keyDown(menu, { key: "Escape" });
        }

        expect(onFilterChange).not.toHaveBeenCalled();
    });
});
