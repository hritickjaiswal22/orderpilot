import winston from "winston";
import path from "path";

let logger: winston.Logger | null = null;

if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
  logger = winston.createLogger({
    level: "error",
    // 1. JSON format is the industry standard for file storage
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }), // Captures full error stack traces properly
      winston.format.prettyPrint({ colorize: false, depth: 6 }),
    ),
    transports: [
      new winston.transports.File({
        filename: path.join(process.cwd(), "logs/error.log"),
        level: "error",
      }),
      new winston.transports.File({
        filename: path.join(process.cwd(), "logs/combined.log"),
      }),
    ],
  });
}

export { logger };
