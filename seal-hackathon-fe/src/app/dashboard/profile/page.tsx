"use client";
import { useState, useEffect } from "react";
import { User, Save, Upload, Mail, Book, GraduationCap, MapPin, Target } from "lucide-react";
import { App } from "antd";

export default function ProfilePage() {
  const { message } = App.useApp();
  const [user, setUser] = useState<any>({
    name: "Loading...",
    email: "",
    role: "Member",
    university: "",
    studentId: "",
    skills: "",
    bio: ""
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const stored = (localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser"));
    if (stored) {
      try {
        const parsedUser = JSON.parse(stored);
        setUser(parsedUser);
        setAvatarUrl(localStorage.getItem(`avatar_${parsedUser.email}`));
      } catch (e) {}
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("currentUser", JSON.stringify(user));
    message.success("Profile updated successfully!");
    // Dispatch a custom event to notify TopBar/Sidebar of changes
    window.dispatchEvent(new Event("storage"));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        localStorage.setItem(`avatar_${user.email}`, dataUrl);
        setAvatarUrl(dataUrl);
        // Force re-render of this component and others
        window.dispatchEvent(new Event("storage"));
        // Force local state update for immediate feedback
        setUser({ ...user, _t: Date.now() }); 
        message.success("Avatar updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your personal information and preferences</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap", overflowY: "auto", paddingRight: "0.5rem", paddingBottom: "2rem", flex: 1 }}>
        {/* Avatar Section */}
        <div className="glass-card" style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)", padding: "4px", background: "rgba(255,255,255,0.05)" }} />
          ) : (
            <div className="avatar-placeholder" style={{ width: 120, height: 120, fontSize: "3rem" }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 style={{ fontSize: "1.2rem", margin: "0.25rem 0", color: "var(--color-text-1)" }}>{user.name}</h3>
            <span className="glass-badge primary">{user.role}</span>
          </div>
          <label className="btn btn-secondary btn-sm" style={{ cursor: "pointer", marginTop: "0.5rem" }}>
            <Upload size={14} style={{ marginRight: 4 }} /> Change Avatar
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </label>
        </div>

        {/* Profile Info Form */}
        <div className="glass-card" style={{ flex: "2 1 400px" }}>
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} /> Full Name</label>
                <input className="form-input" value={user.name || ""} onChange={(e) => setUser({ ...user, name: e.target.value })} required disabled={user.role === "Admin"} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} /> Email Address</label>
                <input className="form-input" type="email" value={user.email || ""} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>

            <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label"><Book size={13} style={{ display: 'inline', marginRight: 4 }} /> University</label>
                <input className="form-input" placeholder="FPT University" value={user.university || ""} onChange={(e) => setUser({ ...user, university: e.target.value })} disabled={user.role === "Admin"} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
              </div>
              <div className="form-group">
                <label className="form-label"><GraduationCap size={13} style={{ display: 'inline', marginRight: 4 }} /> Student ID</label>
                <input className="form-input" placeholder="e.g. SE123456" value={user.studentId || ""} onChange={(e) => setUser({ ...user, studentId: e.target.value })} disabled={user.role === "Admin"} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label"><Target size={13} style={{ display: 'inline', marginRight: 4 }} /> Skills / Technologies</label>
              <input className="form-input" placeholder="e.g. React, Node.js, AI, Figma" value={user.skills || ""} onChange={(e) => setUser({ ...user, skills: e.target.value })} disabled={user.role === "Admin"} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
            </div>

            <div className="form-group">
              <label className="form-label">Bio / About Me</label>
              <textarea className="form-textarea" rows={4} placeholder="A short description about yourself..." value={user.bio || ""} onChange={(e) => setUser({ ...user, bio: e.target.value })} disabled={user.role === "Admin"} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", resize: "none" }} />
            </div>

            {user.role === "Admin" ? (
              <div style={{ marginTop: "1rem", color: "var(--color-danger)", fontSize: "0.85rem", textAlign: "right" }}>
                Administrator profile cannot be modified.
              </div>
            ) : (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border-1)" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 1.5rem" }}>
                  <Save size={16} style={{ marginRight: 6 }} /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

