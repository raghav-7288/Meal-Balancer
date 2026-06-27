import { Calendar, Edit2, Phone, Ruler, Save, Scale, User } from "lucide-react";
import { sanitizeNumeric, clampOnBlur } from "../../../utils/inputSanitize";
import { COUNTRY_CODES } from "../../../data/countryCodes";

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
                <div
                    className="pro-card-icon"
                    style={{ background: "#d1fae5", color: "#059669" }}
                    aria-hidden="true"
                >
                    <Ruler size={16} />
                </div>
                <h2>Body Details</h2>
                {!isEditing && (
                    <button
                        type="button"
                        className="pro-btn pro-btn-edit"
                        onClick={() => setIsEditing(true)}
                        style={{ marginLeft: "auto" }}
                        aria-label="Edit body details"
                    >
                        <Edit2 size={14} aria-hidden="true" />
                        Edit
                    </button>
                )}
            </div>
            <div className="pro-card-body">
                {isEditing ? (
                    <>
                        <div className="pro-measurements-grid">
                            <div className="pro-measure-field">
                                <label className="pro-field-label" htmlFor="body-height">
                                    <Ruler size={13} aria-hidden="true" /> Height
                                </label>
                                <div className="pro-input-with-unit">
                                    <input
                                        id="body-height"
                                        className="pro-input"
                                        type="number"
                                        placeholder="165"
                                        min="30"
                                        max="300"
                                        value={height}
                                        onChange={(e) => setHeight(sanitizeNumeric(e.target.value))}
                                        onBlur={(e) =>
                                            setHeight(clampOnBlur(e.target.value, 30, 300))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "-" || e.key === "e") e.preventDefault();
                                        }}
                                    />
                                    <span className="pro-unit" aria-hidden="true">
                                        cm
                                    </span>
                                </div>
                            </div>
                            <div className="pro-measure-field">
                                <label className="pro-field-label" htmlFor="body-weight">
                                    <Scale size={13} aria-hidden="true" /> Weight
                                </label>
                                <div className="pro-input-with-unit">
                                    <input
                                        id="body-weight"
                                        className="pro-input"
                                        type="number"
                                        placeholder="60"
                                        min="1"
                                        max="500"
                                        value={weight}
                                        onChange={(e) => setWeight(sanitizeNumeric(e.target.value))}
                                        onBlur={(e) =>
                                            setWeight(clampOnBlur(e.target.value, 1, 500))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === "-" || e.key === "e") e.preventDefault();
                                        }}
                                    />
                                    <span className="pro-unit" aria-hidden="true">
                                        kg
                                    </span>
                                </div>
                            </div>
                            <div className="pro-measure-field">
                                <label className="pro-field-label" htmlFor="body-age">
                                    <Calendar size={13} aria-hidden="true" /> Age
                                </label>
                                <div className="pro-input-with-unit">
                                    <input
                                        id="body-age"
                                        className="pro-input"
                                        type="number"
                                        placeholder="25"
                                        min="1"
                                        max="150"
                                        value={age}
                                        onChange={(e) => setAge(sanitizeNumeric(e.target.value))}
                                        onBlur={(e) => setAge(clampOnBlur(e.target.value, 1, 150))}
                                        onKeyDown={(e) => {
                                            if (e.key === "-" || e.key === "e") e.preventDefault();
                                        }}
                                    />
                                    <span className="pro-unit" aria-hidden="true">
                                        yrs
                                    </span>
                                </div>
                            </div>
                            <div className="pro-measure-field">
                                <label className="pro-field-label" htmlFor="body-sex">
                                    <User size={13} aria-hidden="true" /> Sex
                                </label>
                                <select
                                    id="body-sex"
                                    className="pro-input pro-select"
                                    value={editSex}
                                    onChange={(e) => setEditSex(e.target.value)}
                                >
                                    <option value="female">Female</option>
                                    <option value="male">Male</option>
                                </select>
                            </div>
                            <div className="pro-measure-field pro-measure-full">
                                <label className="pro-field-label" htmlFor="body-contact">
                                    <Phone size={13} aria-hidden="true" /> Contact
                                </label>
                                <div className="pro-phone-field">
                                    <select
                                        className="pro-select pro-country-code-select"
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        aria-label="Country code"
                                    >
                                        {COUNTRY_CODES.map((cc) => (
                                            <option key={cc.code} value={cc.code}>
                                                {cc.label}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        id="body-contact"
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
                                type="button"
                                className="pro-btn pro-btn-primary"
                                onClick={onSaveDetails}
                                disabled={detailsSaving}
                                aria-busy={detailsSaving}
                            >
                                <Save size={14} aria-hidden="true" />
                                {detailsSaving ? "Saving…" : "Save Details"}
                            </button>
                            <button
                                type="button"
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
                            <span className="pro-detail-label">
                                <Ruler size={13} aria-hidden="true" /> Height
                            </span>
                            <span className="pro-detail-value">
                                {height ? `${height} cm` : "—"}
                            </span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label">
                                <Scale size={13} aria-hidden="true" /> Weight
                            </span>
                            <span className="pro-detail-value">
                                {weight ? `${weight} kg` : "—"}
                            </span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label">
                                <Calendar size={13} aria-hidden="true" /> Age
                            </span>
                            <span className="pro-detail-value">{age ? `${age} yrs` : "—"}</span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label">
                                <User size={13} aria-hidden="true" /> Sex
                            </span>
                            <span className="pro-detail-value">
                                {editSex ? editSex.charAt(0).toUpperCase() + editSex.slice(1) : "—"}
                            </span>
                        </div>
                        <div className="pro-detail-row">
                            <span className="pro-detail-label">
                                <Phone size={13} aria-hidden="true" /> Contact
                            </span>
                            <span className="pro-detail-value">
                                {contactNumber ? `${countryCode} ${contactNumber}` : "—"}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default BodyMeasurementsCard;
