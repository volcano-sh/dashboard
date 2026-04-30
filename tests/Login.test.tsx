import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "../components/auth/LoginPageContent";

const mocks = vi.hoisted(() => ({
    auth: {
        authConfig: {
            mode: "local",
            providerName: "SSO",
            ssoEnabled: false,
        },
        loginWithToken: vi.fn(),
    },
    axiosPost: vi.fn(),
    searchParams: new URLSearchParams(),
}));

vi.mock("axios", () => ({
    default: {
        post: mocks.axiosPost,
    },
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: vi.fn() }),
    useSearchParams: () => mocks.searchParams,
}));

vi.mock("../components/auth/AuthProvider", () => ({
    useAuth: () => mocks.auth,
}));

describe("Login page", () => {
    beforeEach(() => {
        mocks.auth.authConfig = {
            mode: "local",
            providerName: "SSO",
            ssoEnabled: false,
        };
        mocks.auth.loginWithToken = vi.fn();
        mocks.axiosPost.mockReset();
        mocks.searchParams = new URLSearchParams();
    });

    it("renders local login without the SSO action in local mode", () => {
        render(<LoginPage />);

        expect(
            screen.getByRole("heading", { name: /welcome back/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/enter your username/i),
        ).toBeVisible();
        expect(
            screen.getByPlaceholderText(/enter your password/i),
        ).toBeVisible();
        expect(
            screen.queryByRole("button", { name: /continue with/i }),
        ).not.toBeInTheDocument();
    });

    it("renders the SSO action in local-sso mode", () => {
        mocks.auth.authConfig = {
            mode: "local-sso",
            providerName: "Keycloak",
            ssoEnabled: true,
        };

        render(<LoginPage />);

        expect(
            screen.getByRole("button", { name: /continue with keycloak/i }),
        ).toBeInTheDocument();
    });

    it("submits local credentials and stores the returned token", async () => {
        const user = userEvent.setup();
        mocks.axiosPost.mockResolvedValue({
            data: { token: "dashboard.jwt" },
        });
        mocks.auth.loginWithToken.mockResolvedValue();

        render(<LoginPage />);

        await user.type(
            screen.getByPlaceholderText(/enter your username/i),
            "admin",
        );
        await user.type(
            screen.getByPlaceholderText(/enter your password/i),
            "admin",
        );
        await user.click(screen.getByRole("button", { name: /^sign in$/i }));

        await waitFor(() => {
            expect(mocks.axiosPost).toHaveBeenCalledWith("/api/v1/auth/local", {
                password: "admin",
                remember: false,
                username: "admin",
            });
        });
        expect(mocks.auth.loginWithToken).toHaveBeenCalledWith(
            "dashboard.jwt",
            false,
        );
    });

    it("shows a login failure message when local auth rejects credentials", async () => {
        const user = userEvent.setup();
        mocks.axiosPost.mockRejectedValue({
            response: {
                data: { message: "Invalid username or password." },
            },
        });

        render(<LoginPage />);

        await user.type(
            screen.getByPlaceholderText(/enter your username/i),
            "admin",
        );
        await user.type(
            screen.getByPlaceholderText(/enter your password/i),
            "wrong",
        );
        await user.click(screen.getByRole("button", { name: /^sign in$/i }));

        expect(await screen.findByText(/login failed/i)).toBeInTheDocument();
        expect(
            screen.getByText(/invalid username or password/i),
        ).toBeInTheDocument();
    });

    it("surfaces SSO callback errors from the URL", () => {
        mocks.searchParams = new URLSearchParams("error=SSO%20login%20failed.");

        render(<LoginPage />);

        expect(screen.getByText(/sso login failed/i)).toBeInTheDocument();
    });
});
