export const contextMiddleware = (req, res, next) => {
    req.clusterContext = req.headers["x-cluster-context"] || "default";
    next();
};
