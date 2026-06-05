"use client";
import { useEffect, useState } from "react";
import { User, Save, Mail, Phone, Lock } from "lucide-react";
import { App } from "antd";
import { CurrentUser, apiRequest, fetchCurrentUser } from "@/lib/api";

export default function AdminProfilePage() {
  const { message } = App.useApp();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    fetchCurrentUser()
      .then(setUser)
      .catch((err) => message.error(err instanceof Error ? err.message : "Could not load profile."))
      .finally(() => setLoading(false));
  }, [message]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const updated = await apiRequest<CurrentUser>("/Auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber || null,
          studentCode: user.studentCode || null,
        }),
      });

      setUser(updated);
      localStorage.setItem("currentUser", JSON.stringify(updated));
      window.dispatchEvent(new Event("storage"));
      message.success("Profile updated successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/Auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      message.success("Password changed successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading profile</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Profile</h1>
          <p className="page-subtitle">Manage your administrator account through the backend API</p>
        </div>
      </div>

      <div className="glass-card">
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem" }}>
            <div className="avatar-placeholder" style={{ width: 64, height: 64, fontSize: "1.5rem", borderRadius: "50%" }}>
              {user.fullName.charAt(0)}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{user.fullName}</h3>
              <span className="badge badge-primary">{user.role}</span>
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label"><User size={13} style={{ display: "inline", marginRight: 4 }} /> Full Name</label>
              <input className="form-input" value={user.fullName || ""} onChange={(e) => setUser({ ...user, fullName: e.target.value, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label"><Mail size={13} style={{ display: "inline", marginRight: 4 }} /> Email Address</label>
              <input className="form-input" type="email" value={user.email || ""} disabled />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 380 }}>
            <label className="form-label"><Phone size={13} style={{ display: "inline", marginRight: 4 }} /> Phone Number</label>
            <input className="form-input" value={user.phoneNumber || ""} onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })} />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card" style={{ marginTop: "2rem" }}>
        <form onSubmit={handlePasswordChange} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
            <Lock size={18} /> Change Password
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
            </div>
          </div>

          <div className="form-group" style={{ maxWidth: 380 }}>
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" className="btn btn-secondary" disabled={saving}>
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
