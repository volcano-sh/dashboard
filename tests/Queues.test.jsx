import Queues from "../components/queues/Queues";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import axios from "axios";

vi.mock("axios");

const queueResponse = {
    data: {
        items: [
            {
                metadata: {
                    name: "root",
                    creationTimestamp: "2026-04-23T02:23:58Z",
                },
                spec: {
                    weight: 1,
                    capability: { cpu: "500", memory: "1Ti" },
                    guarantee: { resource: { cpu: "100", memory: "256Gi" } },
                    reclaimable: true,
                },
                status: {
                    state: "Open",
                    allocated: { cpu: "120", memory: "256Gi" },
                    pending: { cpu: "30", memory: "64Gi" },
                },
            },
            {
                metadata: {
                    name: "prod",
                    creationTimestamp: "2026-04-23T02:23:58Z",
                },
                spec: {
                    parent: "root",
                    weight: 1,
                    capability: { cpu: "500", memory: "1Ti" },
                    reclaimable: true,
                },
                status: {
                    state: "Open",
                    allocated: { cpu: "120", memory: "256Gi" },
                },
            },
        ],
        totalCount: 2,
    },
};

describe("Queues", () => {
    beforeEach(() => {
        const storage = {};
        vi.stubGlobal("localStorage", {
            getItem: (key) => storage[key] || null,
            setItem: (key, value) => {
                storage[key] = value;
            },
        });
        axios.get.mockResolvedValue(queueResponse);
    });

    it("should render hierarchy only and open details after selecting a queue", async () => {
        render(<Queues />);

        expect(
            screen.getByRole("heading", { name: /queues/i }),
        ).toBeInTheDocument();
        expect(screen.getByText(/queue hierarchy/i)).toBeInTheDocument();
        expect(screen.queryByText(/queue details/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/^view:/i)).not.toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("prod")).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText("prod"));

        await waitFor(() => {
            expect(screen.getByText(/queue details/i)).toBeInTheDocument();
        });
        expect(screen.getByText("Create Queue")).toBeInTheDocument();
    });
});
