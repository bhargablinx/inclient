import { logger } from "../utils/logger.js";

/**
 * Express middleware to record structured HTTP request logs.
 */
export const requestLogger = (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
        const durationMs = Date.now() - start;
        const logData = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs,
            ip: req.ip || req.headers["x-forwarded-for"],
        };

        if (res.statusCode >= 400) {
            logger.warn(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`, logData);
        } else {
            logger.info(`HTTP ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`, logData);
        }
    });

    next();
};
