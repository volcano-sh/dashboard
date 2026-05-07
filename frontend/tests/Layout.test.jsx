import Layout from "../src/components/Layout";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { I18nProvider } from "../src/i18n/I18nProvider";

const menuItems = [
    { text: "Dashboard", path: "/dashboard" },
    { text: "Jobs", path: "/jobs" },
    { text: "Queues", path: "/queues" },
    { text: "Pods", path: "/pods" },
    { text: "PodGroups", path: "/podgroups" },
];

describe("Layout", () => {
    const renderLayout = () =>
        render(
            <I18nProvider>
                <MemoryRouter>
                    <Layout />
                </MemoryRouter>
            </I18nProvider>,
        );

    it("should render the layout", () => {
        renderLayout();

        const heading = screen.getByText(/volcano dashboard/i);
        expect(heading).toBeInTheDocument();
    });

    it("should toggle the drawer when clicking the menu button", () => {
        renderLayout();

        const menuButton = screen.getByRole("button", {
            name: /toggle drawer/i,
        });

        expect(menuButton).toBeInTheDocument();

        const drawer = screen.getByTestId("sidebar-drawer");

        expect(drawer).toHaveStyle("width: 240px");

        fireEvent.click(menuButton);

        expect(drawer).toHaveStyle("width: 60px");
    });

    it("should have 5 navigation items", () => {
        renderLayout();

        const navigationItems = screen.getAllByRole("link");

        expect(navigationItems).toHaveLength(5);

        navigationItems.forEach((item, index) => {
            const { text, path } = menuItems[index];
            expect(item).toBeInTheDocument();
            expect(item).toHaveAttribute("href", path);
            expect(item).toHaveTextContent(new RegExp(`^${text}$`, "i"));
        });
    });

    it("should render logo", () => {
        renderLayout();

        const logo = screen.getByAltText(/volcano logo/i);

        expect(logo).toBeInTheDocument();

        expect(logo).toHaveAttribute(
            "src",
            "/src/assets/volcano-icon-color.svg",
        );
    });

    it("should switch navigation labels to Chinese", () => {
        renderLayout();

        fireEvent.click(screen.getByRole("button", { name: /中文/i }));

        expect(screen.getByText("概览")).toBeInTheDocument();
        expect(screen.getByText("作业")).toBeInTheDocument();
        expect(screen.getByText("队列")).toBeInTheDocument();
    });
});
