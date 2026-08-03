import ApiError from "../utils/ApiError.js";

/**
 * Custom CSRF Protection Middleware for Express.
 * Validates state-changing HTTP requests (POST, PUT, PATCH, DELETE) that use cookie-based auth.
 * Requires custom header 'x-requested-with' or 'x-csrf-token' which browser cross-origin requests cannot forge without CORS preflight.
 */
export const verifyCSRF = (req, res, next) => {
    const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];

    if (stateChangingMethods.includes(req.method.toUpperCase())) {
        const isCookieAuth = Boolean(req.cookies?.accessToken);

        if (isCookieAuth) {
            const csrfHeader =
                req.headers["x-requested-with"] ||
                req.headers["x-csrf-token"];

            if (!csrfHeader) {
                throw new ApiError(
                    403,
                    "CSRF protection error: Custom header missing on state-changing request!"
                );
            }
        }
    }

    next();
};
