/**
 * Shared country codes and phone number parsing utilities.
 * Used by ProfilePage and BodyMeasurementsCard.
 */

export const COUNTRY_CODES = [
    { code: "+91", country: "IN", label: "🇮🇳 +91" },
    { code: "+1", country: "US", label: "🇺🇸 +1" },
    { code: "+44", country: "GB", label: "🇬🇧 +44" },
    { code: "+61", country: "AU", label: "🇦🇺 +61" },
    { code: "+86", country: "CN", label: "🇨🇳 +86" },
    { code: "+81", country: "JP", label: "🇯🇵 +81" },
    { code: "+49", country: "DE", label: "🇩🇪 +49" },
    { code: "+33", country: "FR", label: "🇫🇷 +33" },
    { code: "+971", country: "AE", label: "🇦🇪 +971" },
    { code: "+65", country: "SG", label: "🇸🇬 +65" },
    { code: "+966", country: "SA", label: "🇸🇦 +966" },
    { code: "+82", country: "KR", label: "🇰🇷 +82" },
    { code: "+55", country: "BR", label: "🇧🇷 +55" },
    { code: "+7", country: "RU", label: "🇷🇺 +7" },
    { code: "+27", country: "ZA", label: "🇿🇦 +27" },
    { code: "+234", country: "NG", label: "🇳🇬 +234" },
    { code: "+62", country: "ID", label: "🇮🇩 +62" },
    { code: "+60", country: "MY", label: "🇲🇾 +60" },
    { code: "+64", country: "NZ", label: "🇳🇿 +64" },
    { code: "+39", country: "IT", label: "🇮🇹 +39" },
    { code: "+34", country: "ES", label: "🇪🇸 +34" },
    { code: "+52", country: "MX", label: "🇲🇽 +52" },
    { code: "+977", country: "NP", label: "🇳🇵 +977" },
    { code: "+94", country: "LK", label: "🇱🇰 +94" },
    { code: "+880", country: "BD", label: "🇧🇩 +880" },
    { code: "+92", country: "PK", label: "🇵🇰 +92" },
];

/** Extract country code and local number from a stored contact string like "+91 9876543210" */
export function parseContactNumber(stored) {
    if (!stored) return { code: "+91", local: "" };
    const trimmed = stored.trim();
    const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
    for (const cc of sorted) {
        if (trimmed.startsWith(cc.code)) {
            return { code: cc.code, local: trimmed.slice(cc.code.length).trim() };
        }
    }
    return { code: "+91", local: trimmed };
}
