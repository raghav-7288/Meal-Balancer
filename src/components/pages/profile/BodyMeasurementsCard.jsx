import {
    Calendar,
    Edit2,
    Phone,
    Ruler,
    Save,
    Scale,
    User,
} from "lucide-react";

const COUNTRY_CODES = [
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

/** Allow free typing but strip negatives. */
function sanitizeNumeric(value) {
    if (value === "") return "";
    const cleaned = value.replace(/^-/, "").replace(/[^0-9.]/g, "");
    if (cleaned === "" || cleaned === ".") return "";
    return cleaned;
}

/** Clamp value to [min, max] — call on blur only */
function clampOnBlur(value, min = 0, max = Infinity) {
    if (value === "") return "";
    const num = parseFloat(value);
    if (isNaN(num)) return "";
    return String(Math.min(Math.max(num, min), max));
}

function BodyMeasurementsCard({
    isEditing,
    setIsEditing,
    height,
    setHeight,
    weight,
    setWeight,
    age,
    setAge,
    editSex,
    setEditSex,
    contactNumber,
    setContactNumber,
    countryCode,
    setCountryCode,
    detailsSaving,
    onSaveDetails,
    onCancelEdit,
}) {
    return (
        <div className="pro-card">
            <div className="pro-card-header">
                <div className="pro-card-icon" style={{ background: "#d1fae5", color: "#059669" }}>
                    <Ruler size={16} />
                </div>
                <h2>Body Details</h2>
                {!isEditing && (
                    <button
                        className="pro-btn pro-btn-edit"
                        onClick={() => setIsEditing(true)}
                        style={{ marginLeft: "auto" }}
                    >
                        <Edit2 size={14} />
                        Edit
                    </button>
                )}
            </div>
            <div className="pro-card-body">
                {isEditing ? (
                    <>
                        <div className="pro-measurements-grid">
                            <div className="pro-measure-field">
                                <label className="pro-field-label">
                                    <Ruler size={13} /> Height
                                </label>
                                <div className="pro-input-with-unit">
                                    <input
                                        className="pro-input"
                                        type="number"
                                        placeholder="165"
                                        min="30"
                                        max="300"
                                        value={height}
                                        onChange={(e) => setHeight(sanitizeNumeric(e.target.value))}
                                        onBlur={(e) => setHeight(clampOnBlur(e.target.value, 30, 300))}
                                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                                    />
                                    <span className="pro-unit">cm</span>
                                </div>
                            </div>
                            <div className="pro-measure-field">
                                <label className="pro-field-label">
                                    <Scale size={13} /> Weight
                                </label>
                                <div className="pro-input-with-unit">
                                    <input
                                        className="pro-input"
                                        type="number"
                                        placeholder="60"
                                        min="1"
                                        max="500"
                                        value={weight}
                                        onChange={(e) => setWeight(sanitizeNumeric(e.target.value))}
                                        onBlur={(e) => setWeight(clampOnBlur(e.target.value, 1, 500))}
                                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                                    />
                                    <span className="pro-unit">kg</span>
                                </div>
                            </div>
                            <div className="pro-measure-field">
                                <label className="pro-field-label">
                                    <Calendar size={13} /> Age
                                </label>
                                <div className="pro-input-with-unit">
                                    <input
                                        className="pro-input"
                                        type="number"
                                        placeholder="25"
                                        min="1"
                                        max="150"
                                        value={age}
                                        onChange={(e) => setAge(sanitizeNumeric(e.target.value))}
                                        onBlur={(e) => setAge(clampOnBlur(e.target.value, 1, 150))}
                                        onKeyDown={(e) => { if (e.key === "-" || e.key === "e") e.preventDefault(); }}
                                    />
                                    <span className="pro-unit">yrs</span>
                                </div>
                            </div>
                            <div className="pro-measure-field">
                                <label className="pro-field-label">
                                    <User size={13} /> Sex
                                </label>
                                <select
                                    className="pro-input pro-select"
                                    value={editSex}
                                    onChange={(e) => setEditSex(e.target.value)}
                                >
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                </select>
                            </div>
                            <div className="pro-measure-field pro-measure-full">
                                <label className="pro-field-label">
                                    <Phone size={13} /> Contact
                                </label>
                                <div className="pro-phone-field">
                                    <select
                                        className="pro-select pro-country-code-select"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                    >
                                        {COUNTRY_CODES.map((cc) => (
                                            <option key={cc.code} value={cc.code}>
                                                {cc.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        className="pro-input pro-phone-input"
                                        type="tel"
                                        placeholder="9876543210"
                                        maxLength={15}
                                        value={contactNumber}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9\s]/g, "");
                                            setContactNumber(val);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pro-details-actions">
                            <button
                                className="pro-btn pro-btn-primary"
                                onClick={onSaveDetails}
                                disabled={detailsSaving}
                            >
                                <Save size={14} />
                                {detailsSaving ? "Saving…" : "Save Details"}
                            </button>
                            <button
                                className="pro-btn pro-btn-secondary"
                                onClick={onCancelEdit}
                                disabled={detailsSaving}
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="pro-details-view">
                        <div className="pro-detail-row">
                            <span className="pro-detail-label"><Ruler size={13} /> Height</span>
                            <span className="pro-detail-value">{height ? `${height} cm` : "—"}</span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label"><Scale size={13} /> Weight</span>
                            <span className="pro-detail-value">{weight ? `${weight} kg` : "—"}</span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label"><Calendar size={13} /> Age</span>
                            <span className="pro-detail-value">{age ? `${age} yrs` : "—"}</span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label"><User size={13} /> Sex</span>
                            <span className="pro-detail-value">{editSex ? editSex.charAt(0).toUpperCase() + editSex.slice(1) : "—"}</span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label"><Phone size={13} /> Contact</span>
                            <span className="pro-detail-value">{contactNumber ? `${countryCode} ${contactNumber}` : "—"}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BodyMeasurementsCard;

