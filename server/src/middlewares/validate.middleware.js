import ApiError from "../utils/ApiError.js";

/**
 * Middleware factory to validate request body, params, or query against a Zod schema.
 * @param {import("zod").ZodTypeAny} schema - Zod schema to parse against.
 * @param {"body"|"query"|"params"} target - Target request property to validate (default: "body").
 */
export const validate = (schema, target = "body") => (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
        const errorMessage = result.error.issues
            .map((issue) => `${issue.path.join(".") || target}: ${issue.message}`)
            .join("; ");
        return next(new ApiError(400, errorMessage));
    }
    req[target] = result.data;
    next();
};
