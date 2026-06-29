/**
 * Shared country codes and phone number parsing utilities.
 * Used by ProfilePage and BodyMeasurementsCard.
 */

export const COUNTRY_CODES = [
    { code: "+91", country: "IN", label: "🇮🇳 India (+91)" },
    { code: "+1", country: "US", label: "🇺🇸 United States (+1)" },
    { code: "+44", country: "GB", label: "🇬🇧 United Kingdom (+44)" },
    { code: "+61", country: "AU", label: "🇦🇺 Australia (+61)" },
    { code: "+86", country: "CN", label: "🇨🇳 China (+86)" },
    { code: "+81", country: "JP", label: "🇯🇵 Japan (+81)" },
    { code: "+49", country: "DE", label: "🇩🇪 Germany (+49)" },
    { code: "+33", country: "FR", label: "🇫🇷 France (+33)" },
    { code: "+971", country: "AE", label: "🇦🇪 UAE (+971)" },
    { code: "+65", country: "SG", label: "🇸🇬 Singapore (+65)" },
    { code: "+966", country: "SA", label: "🇸🇦 Saudi Arabia (+966)" },
    { code: "+82", country: "KR", label: "🇰🇷 South Korea (+82)" },
    { code: "+55", country: "BR", label: "🇧🇷 Brazil (+55)" },
    { code: "+7", country: "RU", label: "🇷🇺 Russia (+7)" },
    { code: "+27", country: "ZA", label: "🇿🇦 South Africa (+27)" },
    { code: "+234", country: "NG", label: "🇳🇬 Nigeria (+234)" },
    { code: "+62", country: "ID", label: "🇮🇩 Indonesia (+62)" },
    { code: "+60", country: "MY", label: "🇲🇾 Malaysia (+60)" },
    { code: "+64", country: "NZ", label: "🇳🇿 New Zealand (+64)" },
    { code: "+39", country: "IT", label: "🇮🇹 Italy (+39)" },
    { code: "+34", country: "ES", label: "🇪🇸 Spain (+34)" },
    { code: "+52", country: "MX", label: "🇲🇽 Mexico (+52)" },
    { code: "+977", country: "NP", label: "🇳🇵 Nepal (+977)" },
    { code: "+94", country: "LK", label: "🇱🇰 Sri Lanka (+94)" },
    { code: "+880", country: "BD", label: "🇧🇩 Bangladesh (+880)" },
    { code: "+92", country: "PK", label: "🇵🇰 Pakistan (+92)" },
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
