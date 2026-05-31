import { useAuth } from "../hooks/useAuth";
import { LogOut, User } from "lucide-react";

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
                    <span>{user?.email || "—"}</span>
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


