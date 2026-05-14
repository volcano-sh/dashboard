import React from "react";
import Layout from "../src/components/Layout";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { LanguageContext } from "../src/contexts/LanguageContext";

const menuItems = [
    { text: "Dashboard", path: "/dashboard" },
    { text: "Jobs", path: "/jobs" },
    { text: "Queues", path: "/queues" },
    { text: "Pods", path: "/pods" },
    { text: "PodGroups", path: "/podgroups" },
    { text: "Scheduler", path: "/scheduler" },
];

// Helper to render with all required providers
const renderWithProviders = (ui) => {
    return render(
        <LanguageContext.Provider value={{ lang: "en" }}>
            <MemoryRouter>{ui}</MemoryRouter>
        </LanguageContext.Provider>,
    );
};

describe("Layout", () => {
    it("should render the layout", () => {
        renderWithProviders(<Layout />);

        const heading = screen.getByText(/volcano dashboard/i);
        expect(heading).toBeInTheDocument();
    });

    it("should toggle the drawer when clicking the menu button", () => {
        renderWithProviders(<Layout />);

        const menuButton = screen.getByRole("button", {
            name: /toggle drawer/i,
        });

        expect(menuButton).toBeInTheDocument();

        const drawer = screen.getByTestId("sidebar-drawer");

        expect(drawer).toHaveStyle("width: 240px");

        fireEvent.click(menuButton);

        expect(drawer).toHaveStyle("width: 60px");
    });

    it("should have 6 navigation items", () => {
        renderWithProviders(<Layout />);

        const navigationItems = screen.getAllByRole("link");

        expect(navigationItems).toHaveLength(6);

        navigationItems.forEach((item, index) => {
            const { text, path } = menuItems[index];
            expect(item).toBeInTheDocument();
            expect(item).toHaveAttribute("href", path);
            expect(item).toHaveTextContent(new RegExp(`^${text}$`, "i"));
        });
    });

    it("should render logo", () => {
        renderWithProviders(<Layout />);

        const logo = screen.getByAltText(/volcano logo/i);

        expect(logo).toBeInTheDocument();

        expect(logo).toHaveAttribute(
            "src",
            "/src/assets/volcano-icon-color.svg",
        );
    });
});
