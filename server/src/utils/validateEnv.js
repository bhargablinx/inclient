/**
 * Asserts the existence of required environment variables on server startup.
 * Throws an immediate descriptive error if critical environment variables are missing.
 */
export const validateEnv = () => {
    const requiredEnvVars = [
        "MONGODB_URL",
        "ACCESS_TOKEN_SECRET",
        "REFRESH_TOKEN_SECRET",
        "CORS_ORIGIN",
        "CLIENT_URL",
    ];

    const missingRequired = requiredEnvVars.filter(
        (key) => !process.env[key] || process.env[key].trim() === ""
    );

    if (missingRequired.length > 0) {
        const errorMessage = `FATAL CONFIGURATION ERROR: Missing required environment variable(s): ${missingRequired.join(
            ", "
        )}. Please check your server/.env configuration before starting.`;
        console.error("\x1b[31m%s\x1b[0m", errorMessage);
        throw new Error(errorMessage);
    }

    if (!process.env.PORT) {
        process.env.PORT = "5000";
    }

    const optionalEnvVars = [
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "RESEND_API_KEY",
    ];

    const missingOptional = optionalEnvVars.filter(
        (key) => !process.env[key] || process.env[key].trim() === ""
    );

    if (missingOptional.length > 0) {
        console.warn(
            "\x1b[33m%s\x1b[0m",
            `[CONFIG WARNING] Missing optional integration keys: ${missingOptional.join(
                ", "
            )}. Media uploads or email dispatches may fail.`
        );
    }
};
