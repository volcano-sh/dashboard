import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import YamlViewer from "../components/details/YamlViewer";

vi.mock("@monaco-editor/react", () => ({
    default: ({ onChange, options, value }) => (
        <textarea
            aria-label="yaml-editor"
            onChange={(event) => onChange?.(event.target.value)}
            readOnly={options?.readOnly}
            value={value}
        />
    ),
}));

describe("YamlViewer", () => {
    it("renders editable YAML and submits parsed manifest", async () => {
        const onSubmit = vi.fn().mockResolvedValue(undefined);
        render(
            <YamlViewer
                data={"apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: demo\n"}
                editable
                onSubmit={onSubmit}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: /edit/i }));
        fireEvent.change(screen.getByLabelText("yaml-editor"), {
            target: {
                value: "apiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: changed\n",
            },
        });
        fireEvent.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() => {
            expect(onSubmit).toHaveBeenCalledWith({
                apiVersion: "v1",
                kind: "ConfigMap",
                metadata: { name: "changed" },
            });
        });
    });

    it("shows validation errors for invalid YAML", async () => {
        const onSubmit = vi.fn();
        render(<YamlViewer data="kind: Pod\n" editable onSubmit={onSubmit} />);

        fireEvent.click(screen.getByRole("button", { name: /edit/i }));
        fireEvent.change(screen.getByLabelText("yaml-editor"), {
            target: { value: "kind: [broken" },
        });
        fireEvent.click(screen.getByRole("button", { name: /submit/i }));

        await waitFor(() => {
            expect(screen.getByText(/unexpected end/i)).toBeInTheDocument();
        });
        expect(onSubmit).not.toHaveBeenCalled();
    });

    it("keeps read-only YAML read only", () => {
        render(<YamlViewer data="kind: Pod\n" />);

        expect(
            screen.queryByRole("button", { name: /edit/i }),
        ).not.toBeInTheDocument();
        expect(screen.getByLabelText("yaml-editor")).toHaveAttribute(
            "readonly",
        );
    });
});
