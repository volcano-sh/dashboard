import { config as dotenvConfig } from "dotenv";

export interface Configs {
    Port: number;
    Env: string;
}

dotenvConfig({ path: "secrets.env" });

export const configs: Configs = {
    Port: parseInt(process.env.PORT || "3001"),
    Env: process.env.NODE_ENV || "development",
};
