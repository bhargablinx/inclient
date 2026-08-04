import { logger } from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Unhandled Exception: ${message}`, {
        statusCode,
        url: req.originalUrl,
        method: req.method,
        stack: err.stack,
    });

    return res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
};

export default errorHandler;
