/**
 * Input sanitization utilities for numeric form fields.
 * Shared between profile components that accept numeric input.
 */

/**
 * Allow free typing but strip negatives and non-numeric characters.
 * Returns empty string for invalid input so the field can be cleared.
 * @param {string} value - Raw input value
 * @returns {string} Sanitized numeric string
 */
export function sanitizeNumeric(value) {
    if (value === "") return "";
    const cleaned = value.replace(/^-/, "").replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") return "";
    return cleaned;
}

/**
 * Clamp a numeric string value to [min, max].
 * Call on blur only so user can type freely without interruption.
 * @param {string} value - The current field value
 * @param {number} [min=0] - Minimum allowed value
 * @param {number} [max=Infinity] - Maximum allowed value
 * @returns {string} Clamped value as string, or empty string if invalid
 */
export function clampOnBlur(value, min = 0, max = Infinity) {
    if (value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return String(Math.min(Math.max(num, min), max));
}
