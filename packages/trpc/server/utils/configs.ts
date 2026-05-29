import { config as dotenvConfig } from "dotenv";

export interface Configs {
  Port: number;
  Env: string;
  AllowedOrigins: string[];
}

dotenvConfig({ path: "secrets.env" });

export const configs: Configs = {
  Port: parseInt(process.env.PORT || "3001"),
  Env: process.env.NODE_ENV || "development",
  AllowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
        .map((o) => o.trim())
        .filter(Boolean)
    : ["http://localhost:3000", "http://localhost:5173"],
};
