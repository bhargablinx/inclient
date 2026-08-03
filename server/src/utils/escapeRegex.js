/**
 * Helper function to escape special regular expression characters in user input.
 * Prevents ReDoS (Regular Expression Denial of Service) and regex injection.
 * @param {string} text - The raw string to escape.
 * @returns {string} The escaped string safe for use in RegExp constructors or $regex MongoDB queries.
 */
export const escapeRegex = (text = "") => {
    if (typeof text !== "string") return "";
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
