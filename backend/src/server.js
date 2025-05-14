import express from "express";
import cors from "cors";
import { routes } from "./routes/index.js";
import { verifyVolcanoSetup } from "./utils/helpers.js";

export const app = express();
app.use(cors({ origin: "*" }));

// Register all routes
routes(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    const volcanoReady = await verifyVolcanoSetup();
    if (volcanoReady) {
        console.log(`Server running on port ${PORT} with Volcano support`);
    } else {
        console.error("Server started but Volcano support is not available");
    }
});
