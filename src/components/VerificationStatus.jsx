import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";
import { resendEmailVerification, isEmailVerified } from "../services/verificationService";

/**
 * VerificationBanner — displays at the top of the dashboard when
 * email is not yet verified.
 */
export function VerificationBanner() {
    const { user } = useAuth();

    const emailVerified = isEmailVerified(user);

    if (emailVerified) return null;

    return (
        <div className="verification-banner" role="alert">
            <div className="verification-banner-item">
                <AlertCircle size={16} aria-hidden="true" />
                <span>
                    Your email is not verified. Please check your inbox or resend the link from your
                    profile.
                </span>
            </div>
        </div>
    );
}

/**
 * VerificationBadge — displays verification badges inline.
 */
export function VerificationBadge({ verified, label }) {
    return (
        <span className={`verification-badge ${verified ? "verified" : "unverified"}`}>
            {verified ? (
                <CheckCircle2 size={12} aria-hidden="true" />
            ) : (
                <AlertCircle size={12} aria-hidden="true" />
            )}
            {label || (verified ? "Verified" : "Not verified")}
        </span>
    );
}

/**
 * EmailVerificationAction — button to resend email verification.
 */
export function EmailVerificationAction() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);

    const emailVerified = isEmailVerified(user);

    if (emailVerified) {
        return <VerificationBadge verified label="Email verified" />;
    }

    async function handleResend() {
        setLoading(true);
        setError(null);
        try {
            await resendEmailVerification(user.email);
            setSent(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="verification-action">
            <VerificationBadge verified={false} label="Email not verified" />
            {sent ? (
                <span className="verification-sent" role="status" aria-live="polite">
                    ✓ Verification email sent!
                </span>
            ) : (
                <button
                    type="button"
                    className="verification-btn"
                    onClick={handleResend}
                    disabled={loading}
                    aria-label="Resend verification email"
                    aria-busy={loading}
                >
                    {loading ? (
                        <Loader2 size={12} className="spin" aria-hidden="true" />
                    ) : (
                        <Send size={12} aria-hidden="true" />
                    )}
                    Resend
                </button>
            )}
            {error && (
                <span className="verification-error" role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}
