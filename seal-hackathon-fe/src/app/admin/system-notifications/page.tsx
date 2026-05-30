"use client";
import { useState, useEffect } from "react";
import { Send, Bell, List } from "lucide-react";
import { App } from "antd";

export default function AdminSystemNotifications() {
  const { message } = App.useApp();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const notifs = JSON.parse(localStorage.getItem("globalNotifications") || "[]");
    setHistory(notifs);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const newNotif = {
      id: Date.now(),
      title,
      desc,
      time: new Date().toLocaleTimeString(),
      unread: true
    };
    const updated = [newNotif, ...history];
    localStorage.setItem("globalNotifications", JSON.stringify(updated));
    setHistory(updated);
    setTitle("");
    setDesc("");
    message.success("System notification sent to all users!");
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">System Notifications</h1>
          <p className="page-subtitle">Broadcast messages to all users</p>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <Send size={18} style={{ color: "var(--color-primary)" }} /> Send New Alert
            </h3>
            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-text-2)" }}>Notification Title</label>
                <input className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. System Maintenance" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-text-2)" }}>Message Content</label>
                <textarea className="form-input" required rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Enter details..." style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", resize: "none" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "0.6rem 1.5rem" }}>
                <Bell size={16} style={{ marginRight: 6 }} /> Broadcast Notification
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)", flexShrink: 0 }}>
              <List size={18} style={{ color: "var(--color-primary)" }} /> Recent Broadcasts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
              {history.length === 0 ? (
                <p style={{ color: "var(--color-text-3)", fontStyle: "italic" }}>No notifications sent yet.</p>
              ) : (
                history.map(n => (
                  <div key={n.id} style={{ padding: "1rem 1.25rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-1)" }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text-1)" }}>{n.title}</div>
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "0.75rem", lineHeight: 1.5 }}>{n.desc}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Bell size={10} /> Sent at: {n.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
