import fs from "node:fs";
import chalk from "chalk";
import path from "node:path";
import { createDirs } from "./_fs.js";
import { config } from "dotenv";

// load environment variables from .env file
config();

/**
 * Logs a message to the console with a specified log level and optionally saves it to a file.
 *
 * @param {any} message - The message to log. (string | Array)
 * @param {Object} options - Extra options for logging. (object)
 * @param {string} options.level - The log level (`info`, `warn`, `error`, or others).
 * @param {boolean} options.devOnly - If `true`, logs only in non-production environments.
 * @param {string} options.logPath - The path to a file where the log should be saved.
 *                                      If specified, the log will also be written to this file. (make sure to give the file name, the last part of the path is the file name)
 *
 * @example
 * log({
 *  message: "Server started",
 *  options: {
 *      level: "info",
 *      devOnly: false,
 *      logPath: "./logs/server.log",
 * });
 */
export const log = ({ message = "", options = {} }) => {
    const { level = "info", devOnly = false, logPath = "" } = options;

    if (devOnly && process.env.NODE_ENV === "production") {
        return;
    }

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${formatMessage(message)}`;

    let coloredMessage;
    switch (level) {
        case "info":
            coloredMessage = chalk.blue(formattedMessage);
            break;
        case "warn":
            coloredMessage = chalk.yellow(formattedMessage);
            break;
        case "error":
            coloredMessage = chalk.red(formattedMessage);
            break;
        default:
            coloredMessage = formattedMessage;
    }

    console.log(coloredMessage);

    if (logPath && typeof logPath === "string" && logPath.length) {
        const dirPath = path.dirname(path.resolve(logPath));
        createDirs(dirPath);
        fs.appendFileSync(logPath, formattedMessage + "\n");
    }
};

const formatMessage = (msg) => {
    if (Array.isArray(msg)) {
        return msg
            .map((item) =>
                typeof item === "object" && item !== null
                    ? JSON.stringify(item)
                    : String(item),
            )
            .join(" ");
    }
    return msg;
};
