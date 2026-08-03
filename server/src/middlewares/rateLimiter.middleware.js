import rateLimit from "express-rate-limit";
import ApiResponse from "../utils/ApiResponse.js";

/**
 * Global rate limiter: 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(
            new ApiResponse(
                options.statusCode,
                null,
                "Too many requests from this IP, please try again after 15 minutes."
            )
        );
    },
});

/**
 * Strict authentication rate limiter: 10 requests per 15 minutes per IP
 * Protects login, signup, forgot password, reset password endpoints against brute force attacks.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        res.status(options.statusCode).json(
            new ApiResponse(
                options.statusCode,
                null,
                "Too many authentication attempts. Please try again after 15 minutes."
            )
        );
    },
});
