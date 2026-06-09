"use client";
import { Settings, Save, Shield, Bell } from "lucide-react";
import { App } from "antd";

export default function SettingsPage() {
  const { message } = App.useApp();
  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Cài đặt</h1>
          <p className="page-subtitle">Quản lý tùy chọn hệ thống và thông báo</p>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
        <div className="glass-card" style={{ marginBottom: "1.5rem", maxWidth: 800 }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}><Shield size={18} style={{ color: "var(--color-primary)" }} /> Bảo mật</h3>
          <div className="form-group">
            <label className="form-label" style={{ color: "var(--color-text-2)" }}>Xác thực hai yếu tố (2FA)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button className="btn btn-secondary">Bật 2FA</button>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)" }}>Thêm một lớp bảo mật phụ cho tài khoản của bạn</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: "1.5rem", maxWidth: 800 }}>
          <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}><Bell size={18} style={{ color: "var(--color-primary)" }} /> Thông báo qua Email</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {["Lời mời vào đội thi", "Cập nhật sự kiện", "Kết quả nộp bài"].map(item => (
              <label key={item} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer", color: "var(--color-text-1)" }}>
                <input type="checkbox" defaultChecked style={{ accentColor: "var(--color-primary)", width: 16, height: 16, cursor: "pointer" }} />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", maxWidth: 800 }}>
          <button className="btn btn-primary" onClick={() => message.success("Đã lưu cài đặt thành công!")} style={{ padding: "0.6rem 1.5rem" }}><Save size={16} style={{ marginRight: 6 }} /> Lưu thay đổi</button>
        </div>
      </div>
    </div>
  );
}
