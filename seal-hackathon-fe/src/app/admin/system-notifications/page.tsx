"use client";
import { useState, useEffect } from "react";
import { Send, Bell, List } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

export default function AdminSystemNotifications() {
  const { message } = App.useApp();
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [history, setHistory] = useState<any[]>([]);

  const fetchNotifications = async () => {
    try {
      const data = await apiRequest<any[]>("/SystemNotifications");
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest("/SystemNotifications", {
        method: "POST",
        body: JSON.stringify({
          title: title,
          message: desc
        })
      });
      setTitle("");
      setDesc("");
      message.success("Đã gửi thông báo hệ thống đến tất cả người dùng!");
      fetchNotifications();
    } catch (err) {
      message.error("Gửi thông báo thất bại.");
    }
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Thông báo hệ thống</h1>
          <p className="page-subtitle">Gửi thông báo đến tất cả người dùng</p>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <Send size={18} style={{ color: "var(--color-primary)" }} /> Gửi thông báo mới
            </h3>
            <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-text-2)" }}>Tiêu đề thông báo</label>
                <input className="form-input" required value={title} onChange={e => setTitle(e.target.value)} placeholder="vd: Bảo trì hệ thống" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ color: "var(--color-text-2)" }}>Nội dung thông báo</label>
                <textarea className="form-input" required rows={4} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Nhập nội dung chi tiết..." style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", resize: "none" }} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-start", padding: "0.6rem 1.5rem" }}>
                <Bell size={16} style={{ marginRight: 6 }} /> Phát thông báo
              </button>
            </form>
          </div>

          <div className="glass-card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)", flexShrink: 0 }}>
              <List size={18} style={{ color: "var(--color-primary)" }} /> Thông báo đã gửi gần đây
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
              {history.length === 0 ? (
                <p style={{ color: "var(--color-text-3)", fontStyle: "italic" }}>Chưa có thông báo nào được gửi.</p>
              ) : (
                history.map(n => (
                  <div key={n.id} style={{ padding: "1rem 1.25rem", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-1)" }}>
                    <div style={{ fontWeight: 600, marginBottom: "0.35rem", color: "var(--color-text-1)" }}>{n.title}</div>
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "0.75rem", lineHeight: 1.5 }}>{n.message}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <Bell size={10} /> Gửi lúc: {new Date(n.createdAt).toLocaleString()}
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
