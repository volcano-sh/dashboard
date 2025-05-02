import { getNamespaces } from "../controllers/namespaceController.js";

export const namespaceRoutes = (app) => {
    app.get("/api/namespaces", getNamespaces);
};
