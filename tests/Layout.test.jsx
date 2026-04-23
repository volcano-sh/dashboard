import Layout from "../components/Layout";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";

const menuItems = [
    { text: "Overview", path: "/dashboard" },
    { text: "Queues", path: "/queues" },
    { text: "Jobs", path: "/jobs" },
    { text: "Pod Groups", path: "/podgroups" },
    { text: "Pods", path: "/pods" },
    { text: "Configuration", path: "/configuration" },
    { text: "Settings", path: "/settings" },
    { text: "Documentation", path: "/documentation" },
];

describe("Layout", () => {
    it("should render the layout", () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );

        const heading = screen.getByText(/volcano dashboard/i);
        expect(heading).toBeInTheDocument();
    });

    it("should toggle the drawer when clicking the menu button", () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );

        const menuButton = screen.getByRole("button", {
            name: /toggle drawer/i,
        });

        expect(menuButton).toBeInTheDocument();

        const drawer = screen.getByTestId("sidebar-drawer");

        expect(drawer).toHaveStyle("width: 280px");

        fireEvent.click(menuButton);

        expect(drawer).toHaveStyle("width: 60px");
    });

    it("should render clickable navigation items", () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );

        const navigationItems = screen.getAllByRole("link");

        expect(navigationItems).toHaveLength(8);

        navigationItems.forEach((item, index) => {
            const { text, path } = menuItems[index];
            expect(item).toBeInTheDocument();
            expect(item).toHaveAttribute("href", path);
            expect(item).toHaveTextContent(new RegExp(`^${text}$`, "i"));
        });
    });

    it("should render disabled navigation placeholders", () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );

        ["Events", "Metrics"].forEach((text) => {
            const item = screen.getByText(text);
            expect(item).toBeInTheDocument();
            expect(item.closest("a")).not.toBeInTheDocument();
        });
    });

    it("should expand the admin menu", () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );

        fireEvent.click(
            screen.getByRole("button", { name: /toggle admin menu/i }),
        );

        expect(screen.getByText(/admin@example.com/i)).toBeInTheDocument();
        expect(screen.getByText(/cluster administrator/i)).toBeInTheDocument();
        expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    it("should render logo", () => {
        render(
            <MemoryRouter>
                <Layout />
            </MemoryRouter>,
        );

        const logo = screen.getByAltText(/volcano logo/i);

        expect(logo).toBeInTheDocument();

        expect(logo).toHaveAttribute("src", "/volcano-icon-color.svg");
    });
});
