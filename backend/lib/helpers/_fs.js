import fs from "node:fs";
import { log } from "./log.js";

/**
 * Creates directories if they do not already exist.
 *
 * @param {...string[]} dirs - A list of directory paths to create.
 *
 * @example
 * // Creates the directories 'logs', 'data', and 'temp/1' if they don't already exist.
 * createDirs('logs', 'data', 'temp/1');
 */
export const createDirs = (...dirs) => {
    dirs.forEach((dir) => {
        try {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        } catch (error) {
            log(`Failed to create directory: ${dir} ${error}`, {
                level: "error",
            });
            throw new Error(`Failed to create dir.`);
        }
    });
};
