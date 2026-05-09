import { Exec } from "@kubernetes/client-node";
import k8sService from "./k8sService.js";

class TerminalService {
    async setupTerminal(ws, contextName, namespace, podName, containerName) {
        try {
            const { kc } = k8sService.getClients(contextName);
            const exec = new Exec(kc);

            const stream = await exec.exec(
                namespace,
                podName,
                containerName,
                ["/bin/sh", "-c", "TERM=xterm-256color; export TERM; [ -x /bin/bash ] && exec /bin/bash || exec /bin/sh"],
                ws, // stdout
                ws, // stderr
                ws, // stdin
                true, // tty
                (status) => {
                    console.log("Terminal status:", status);
                    ws.close();
                }
            );

            ws.on("message", (data) => {
                // Handle input from the web terminal
                // The exec.exec handles stdin if ws is passed as stdin
            });

            ws.on("close", () => {
                // Clean up if necessary
            });

        } catch (error) {
            console.error("Error setting up terminal:", error);
            ws.send("Error: " + error.message);
            ws.close();
        }
    }
}

export default new TerminalService();
