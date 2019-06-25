const { createLogger, format, transports } = require("winston");
require("winston-daily-rotate-file");
import fs from "fs";
import path from "path";
import { LOG_PATH, LOG_FILE, SHOW_FULL_FILE_PATH } from "../config/config";

// const env = process.env.NODE_ENV || "development";

// Create the log directory if it does not exist
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH);
}

// const filename = path.join(LOG_PATH, LOG_FILE);
const customFormat = format.printf((info: any) => `${info.timestamp} [${info.level}] [${info.label}]: ${info.message}`);

export const logger = function(fileName: string = "index") {
  return createLogger({
    // change level if in dev environment versus production
    // level: env === 'production' ? 'info' : 'debug',
    level: "debug",
    exitOnError: false,
    format: format.combine(
      // format.label({ label: process.mainModule === undefined ? "" : path.basename(process.mainModule.filename) }),
      format.label({ label: SHOW_FULL_FILE_PATH ? fileName : path.basename(fileName) }),
      format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
    ),
    transports: [
      new transports.Console({
        format: format.combine(format.colorize(), customFormat)
      }),
      // new transports.File({
      //   dailyRotateFileTransport,
      //   format: format.combine(customFormat)
      // }),
      new transports.DailyRotateFile({
        filename: `${LOG_PATH}/${LOG_FILE}-%DATE%.log`,
        datePattern: "YYYY-MM-DD",
        format: format.combine(customFormat),
        zippedArchive: true,
        maxSize: "50m",
        maxFiles: "30d"
      })
    ]
  });
};
