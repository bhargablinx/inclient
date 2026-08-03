/**
 * Helper function to validate password complexity requirements.
 * Enforces minimum length, uppercase, lowercase, digit, and special character rules.
 * @param {string} password - The raw password string to validate.
 * @returns {string|null} Error message string if password fails validation, or null if valid.
 */
export const validatePasswordStrength = (password) => {
    if (!password || typeof password !== "string" || password.length < 8) {
        return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(password)) {
        return "Password must contain at least one uppercase letter (A-Z).";
    }
    if (!/[a-z]/.test(password)) {
        return "Password must contain at least one lowercase letter (a-z).";
    }
    if (!/\d/.test(password)) {
        return "Password must contain at least one number (0-9).";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return "Password must contain at least one special character.";
    }
    return null;
};
