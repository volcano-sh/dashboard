import Configuration from "../components/configuration/Configuration";
import { fireEvent, render, screen } from "@testing-library/react";

describe("Configuration", () => {
    it("should render the default scheduler configuration tab", () => {
        render(<Configuration />);

        expect(
            screen.getByRole("heading", { name: /configuration/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("tab", { name: /scheduler configuration/i }),
        ).toHaveAttribute("aria-selected", "true");
        expect(screen.getByText(/^scheduler profile$/i)).toBeInTheDocument();
        expect(
            screen.queryByRole("tab", { name: /^queues$/i }),
        ).not.toBeInTheDocument();
    });

    it("should render policies content when selecting the Policies tab", () => {
        render(<Configuration />);

        fireEvent.click(screen.getByRole("tab", { name: /policies/i }));

        expect(screen.getByText(/scheduling algorithms/i)).toBeInTheDocument();
        expect(
            screen.getByText(/dominant resource fairness/i),
        ).toBeInTheDocument();
        expect(screen.getByText(/gang scheduling/i)).toBeInTheDocument();
    });

    it("should render plugins content when selecting the Plugins tab", () => {
        render(<Configuration />);

        fireEvent.click(screen.getByRole("tab", { name: /plugins/i }));

        expect(screen.getByText(/plugins configuration/i)).toBeInTheDocument();
        expect(screen.getByText("Enqueue")).toBeInTheDocument();
        expect(screen.getByText("Plugin Details")).toBeInTheDocument();
    });

    it("should render preemption content when selecting the Preemption tab", () => {
        render(<Configuration />);

        fireEvent.click(screen.getByRole("tab", { name: /preemption/i }));

        expect(
            screen.getByText(/preemption configuration/i),
        ).toBeInTheDocument();
        expect(
            screen.getAllByText(/victim selection policy/i).length,
        ).toBeGreaterThan(0);
        expect(screen.getByText(/view raw yaml/i)).toBeInTheDocument();
    });
});
