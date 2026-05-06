import { render, screen } from "@testing-library/react";
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

    it("renders a read-only access indicator", () => {
        render(
            <DashboardShell>
                <div>content</div>
            </DashboardShell>,
        );

        expect(screen.getByText("Read-only")).toBeInTheDocument();
    });

    it("renders a read-write access indicator", () => {
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

        expect(screen.getByText("Read-write")).toBeInTheDocument();
    });
});
