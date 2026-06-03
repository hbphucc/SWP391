"use client";
import { Settings, Save, Shield, Bell, Globe, Database } from "lucide-react";
import { App } from "antd";
import { useState } from "react";

export default function AdminSettingsPage() {
  const { message } = App.useApp();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const handleSave = () => {
    message.loading({ content: "Saving settings...", key: "settings" });
    setTimeout(() => {
      message.success({ content: "Admin Settings saved successfully!", key: "settings" });
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Global Settings</h1>
          <p className="page-subtitle">Manage system-wide preferences, security, and configurations</p>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <Globe size={18} style={{ color: "var(--color-primary)" }} /> Platform Configuration
            </h3>
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--color-text-2)" }}>Maintenance Mode</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <button 
                  className={`btn ${maintenanceMode ? "btn-primary" : "btn-secondary"}`} 
                  style={{ background: maintenanceMode ? "var(--color-danger)" : "", color: maintenanceMode ? "#fff" : "" }}
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                >
                  {maintenanceMode ? "Enabled (Platform Locked)" : "Disable Maintenance"}
                </button>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)", flex: 1 }}>
                  Prevent non-admin users from accessing the platform during upgrades.
                </span>
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label className="form-label" style={{ color: "var(--color-text-2)" }}>Platform Name</label>
              <input className="form-input" defaultValue="SEAL Hackathon Hub" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <Shield size={18} style={{ color: "var(--color-primary)" }} /> Admin Security
            </h3>
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--color-text-2)" }}>Admin Two-Factor Authentication (2FA)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <button className="btn btn-secondary">Enforce 2FA for all Admins</button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)", display: "block", marginTop: "0.75rem" }}>
                Requires all administrators to use an authenticator app.
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
            <Bell size={18} style={{ color: "var(--color-primary)" }} /> Notification Routing
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              "Notify Admins on new user registration", 
              "Notify Admins on team creation", 
              "Receive daily summary reports",
              "Send alert when judging criteria changes"
            ].map((item, idx) => (
              <label key={idx} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", color: "var(--color-text-1)" }}>
                <input type="checkbox" defaultChecked={idx === 0 || idx === 3} style={{ accentColor: "var(--color-primary)", width: 16, height: 16, cursor: "pointer" }} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: "0.7rem 2rem" }}>
            <Save size={16} style={{ marginRight: 6 }} /> Save All Changes
          </button>
        </div>
      </div>
    </div>
  );
}
