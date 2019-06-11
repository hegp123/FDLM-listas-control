const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
import fs from "fs";
import path from "path";
import { LOG_PATH, LOG_FILE } from "../config/config";

// const env = process.env.NODE_ENV || "development";

// Create the log directory if it does not exist
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH);
}

// const filename = path.join(LOG_PATH, LOG_FILE);
const { combine, timestamp, label, printf, colorize } = format;
const customFormat = printf((info: any) => {
  return `${info.timestamp} ${info.level.toUpperCase()} [${info.label}]: ${info.message}`;
});

export const logger = createLogger({
  // change level if in dev environment versus production
  level: "debug",
  format: format.combine(
    format.label({ label: process.mainModule === undefined ? "" : path.basename(process.mainModule.filename) }),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
  ),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.printf((info: any) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`))
    }),
    // new transports.File({
    //   dailyRotateFileTransport,
    //   format: format.combine(format.printf((info: any) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`))
    // }),
    new transports.DailyRotateFile({
      filename: `${LOG_PATH}/%DATE%-${LOG_FILE}`,
      datePattern: "YYYY-MM-DD",
      format: format.combine(format.printf((info: any) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`))
    })
  ]
});
