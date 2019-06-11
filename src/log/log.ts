var winston = require("winston");

export const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({ json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + "M:/FDLM/Listas de Control/log/debug.log", json: false })
  ],
  exceptionHandlers: [
    new winston.transports.Console({ json: false, timestamp: true }),
    new winston.transports.File({ filename: __dirname + "M:/FDLM/Listas de Control/log/exceptions.log", json: false })
  ],
  exitOnError: false
});
