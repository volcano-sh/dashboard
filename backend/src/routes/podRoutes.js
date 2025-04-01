import {
    getPods,
    getPodYaml,
    getAllPods,
} from "../controllers/podController.js";

export const podRoutes = (app) => {
    app.get("/api/pods", getPods);
    app.get("/api/pod/:namespace/:name/yaml", getPodYaml);
    app.get("/api/all-pods", getAllPods);
};
