import { useAuth } from "../hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { EmailVerificationAction } from "./VerificationStatus";
import "../styles/verification.css";

function UserProfile() {
    const { user, profile, signOut } = useAuth();

    return (
        <div className="user-profile">
            <div className="profile-header">
                <div className="profile-avatar">
                    <User size={20} />
                </div>
                <div className="profile-info">
                    <strong>{profile?.full_name || profile?.username || "User"}</strong>
                    <span className="profile-email">{user?.email}</span>
                </div>
            </div>

            <div className="profile-details">
                <div className="profile-row">
                    <span className="profile-label">Username</span>
                    <span>{profile?.username || "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Full name</span>
                    <span>{profile?.full_name || "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Email</span>
                    <span className="profile-value-with-badge">
                        {user?.email || "—"}
                        <EmailVerificationAction />
                    </span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Age</span>
                    <span>{profile?.age ? `${profile.age} years` : "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Contact</span>
                    <span>{profile?.contact_number || "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Height</span>
                    <span>{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Weight</span>
                    <span>{profile?.weight_kg ? `${profile.weight_kg} kg` : "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">BMI</span>
                    <span>{profile?.current_bmi || "—"}</span>
                </div>
                <div className="profile-row">
                    <span className="profile-label">Member since</span>
                    <span>
                        {profile?.created_at
                            ? new Date(profile.created_at).toLocaleDateString()
                            : "—"}
                    </span>
                </div>
            </div>

            <button className="signout-btn" onClick={signOut}>
                <LogOut size={14} /> Sign out
            </button>
        </div>
    );
}

export default UserProfile;


