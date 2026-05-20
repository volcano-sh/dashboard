import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DashboardShell from "../components/DashboardShell";

const mocks = vi.hoisted(() => ({
    auth: {
        accessMode: "read-only",
        authConfig: {
            accessMode: "read-only",
            authRequired: false,
        },
        user: null,
    },
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/dashboard",
}));

vi.mock("../components/auth/AuthProvider", () => ({
    useAuth: () => mocks.auth,
}));

describe("DashboardShell", () => {
    beforeEach(() => {
        mocks.auth = {
            accessMode: "read-only",
            authConfig: {
                accessMode: "read-only",
                authRequired: false,
            },
            user: null,
        };
    });

    it("renders a read-only banner", () => {
        render(
            <DashboardShell>
                <div>content</div>
            </DashboardShell>,
        );

        expect(screen.getByText("Read-only mode")).toBeInTheDocument();
        expect(
            screen.getByText(
                /You can view resources, but create, update, and delete actions are disabled./i,
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /learn more/i })).toHaveAttribute(
            "href",
            "/documentation",
        );
    });

    it("dismisses the read-only banner for the current shell session", () => {
        render(
            <DashboardShell>
                <div>content</div>
            </DashboardShell>,
        );

        fireEvent.click(
            screen.getByRole("button", {
                name: /dismiss read-only mode banner/i,
            }),
        );

        expect(screen.queryByText("Read-only mode")).not.toBeInTheDocument();
    });

    it("does not render a read-write access indicator or read-only banner", () => {
        mocks.auth = {
            accessMode: "read-write",
            authConfig: {
                accessMode: "read-write",
                authRequired: true,
            },
            user: { displayName: "Administrator", username: "admin" },
        };

        render(
            <DashboardShell>
                <div>content</div>
            </DashboardShell>,
        );

        expect(screen.queryByText("Read-write")).not.toBeInTheDocument();
        expect(screen.queryByText("Read-only mode")).not.toBeInTheDocument();
    });
});
