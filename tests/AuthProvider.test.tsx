import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthProvider, { useAuth } from "../components/auth/AuthProvider";

const mocks = vi.hoisted(() => ({
    axiosGet: vi.fn(),
    axiosPost: vi.fn(),
    clearStoredToken: vi.fn(),
    getStoredToken: vi.fn(() => ""),
    requestEject: vi.fn(),
    requestUse: vi.fn(() => 1),
    responseEject: vi.fn(),
    responseUse: vi.fn(() => 1),
    replace: vi.fn(),
    router: null,
    storedToken: "",
}));

mocks.router = { replace: mocks.replace };

vi.mock("axios", () => ({
    default: {
        get: mocks.axiosGet,
        post: mocks.axiosPost,
        interceptors: {
            request: {
                eject: mocks.requestEject,
                use: mocks.requestUse,
            },
            response: {
                eject: mocks.responseEject,
                use: mocks.responseUse,
            },
        },
    },
}));

vi.mock("next/navigation", () => ({
    usePathname: () => "/dashboard",
    useRouter: () => mocks.router,
}));

vi.mock("../lib/client/auth-token", () => ({
    clearStoredToken: mocks.clearStoredToken,
    getStoredToken: mocks.getStoredToken,
    storeToken: vi.fn((token) => {
        mocks.storedToken = token;
    }),
}));

const Probe = () => {
    const auth = useAuth();
    return (
        <div>
            <span data-testid="loading">{String(auth?.loading)}</span>
            <span data-testid="can-read">{String(auth?.canRead)}</span>
            <span data-testid="can-write">{String(auth?.canWrite)}</span>
            <span data-testid="access-mode">{auth?.accessMode || ""}</span>
            <span data-testid="identity-type">
                {auth?.identity?.type || ""}
            </span>
        </div>
    );
};

const renderProvider = () =>
    render(
        <AuthProvider>
            <Probe />
        </AuthProvider>,
    );

describe("AuthProvider", () => {
    beforeEach(() => {
        mocks.axiosGet.mockReset();
        mocks.axiosPost.mockReset();
        mocks.clearStoredToken.mockReset();
        mocks.getStoredToken.mockReset();
        mocks.getStoredToken.mockReturnValue("");
        mocks.requestEject.mockReset();
        mocks.requestUse.mockClear();
        mocks.responseEject.mockReset();
        mocks.responseUse.mockClear();
        mocks.replace.mockReset();
    });

    it("skips login only when auth is not required", async () => {
        mocks.axiosGet.mockResolvedValueOnce({
            data: {
                accessMode: "read-only",
                authRequired: false,
            },
        });

        renderProvider();

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("false"),
        );
        await waitFor(() =>
            expect(screen.getByTestId("identity-type")).toHaveTextContent(
                "anonymous",
            ),
        );
        expect(screen.getByTestId("can-read")).toHaveTextContent("true");
        expect(screen.getByTestId("can-write")).toHaveTextContent("false");
        expect(screen.getByTestId("access-mode")).toHaveTextContent(
            "read-only",
        );
        expect(mocks.replace).not.toHaveBeenCalled();
    });

    it("redirects to login for authenticated read-only without a token", async () => {
        mocks.axiosGet.mockResolvedValueOnce({
            data: {
                accessMode: "read-only",
                authRequired: true,
            },
        });

        renderProvider();

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("false"),
        );
        expect(mocks.replace).toHaveBeenCalledWith("/login");
        expect(screen.getByTestId("can-read")).toHaveTextContent("false");
    });

    it("loads authenticated read-only identity with read but not write access", async () => {
        mocks.getStoredToken.mockReturnValue("token");
        mocks.axiosGet
            .mockResolvedValueOnce({
                data: {
                    accessMode: "read-only",
                    authRequired: true,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    identity: {
                        accessMode: "read-only",
                        type: "authenticated",
                        username: "admin",
                    },
                    user: {
                        accessMode: "read-only",
                        username: "admin",
                    },
                },
            });

        renderProvider();

        await waitFor(() =>
            expect(screen.getByTestId("loading")).toHaveTextContent("false"),
        );
        await waitFor(() =>
            expect(screen.getByTestId("can-read")).toHaveTextContent("true"),
        );
        expect(screen.getByTestId("can-write")).toHaveTextContent("false");
        expect(screen.getByTestId("identity-type")).toHaveTextContent(
            "authenticated",
        );
        expect(mocks.requestUse).toHaveBeenCalled();
        expect(mocks.responseUse).toHaveBeenCalled();
    });
});
