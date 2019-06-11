// 'use strict';

const { createLogger, format, transports } = require("winston");
import fs from "fs";
import path from "path";
import { LOG_PATH, LOG_FILE } from "../config/config";

// const env = process.env.NODE_ENV || "development";

// Create the log directory if it does not exist
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH);
}

const filename = path.join(LOG_PATH, LOG_FILE);

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
    new transports.File({
      filename,
      format: format.combine(format.printf((info: any) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`))
    })
  ]
});
