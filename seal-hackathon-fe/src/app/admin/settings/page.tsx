"use client";
import { Settings, Save, Shield, Bell, Globe, Database } from "lucide-react";
import { App } from "antd";
import { useState } from "react";

export default function AdminSettingsPage() {
  const { message } = App.useApp();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  
  const handleSave = () => {
    message.loading({ content: "Đang lưu cài đặt...", key: "settings" });
    setTimeout(() => {
      message.success({ content: "Lưu Cài đặt Quản trị viên thành công!", key: "settings" });
    }, 1000);
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Cài đặt Toàn cầu</h1>
          <p className="page-subtitle">Quản lý tùy chọn, bảo mật, và cấu hình trên toàn hệ thống</p>
        </div>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem" }}>
          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <Globe size={18} style={{ color: "var(--color-primary)" }} /> Cấu hình Nền tảng
            </h3>
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--color-text-2)" }}>Chế độ Bảo trì</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <button 
                  className={`btn ${maintenanceMode ? "btn-primary" : "btn-secondary"}`} 
                  style={{ background: maintenanceMode ? "var(--color-danger)" : "", color: maintenanceMode ? "#fff" : "" }}
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                >
                  {maintenanceMode ? "Đã bật (Khóa Nền tảng)" : "Tắt Chế độ Bảo trì"}
                </button>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)", flex: 1 }}>
                  Ngăn chặn người dùng không phải quản trị viên truy cập nền tảng trong quá trình nâng cấp.
                </span>
              </div>
            </div>
            
            <div className="form-group" style={{ marginTop: "1.5rem" }}>
              <label className="form-label" style={{ color: "var(--color-text-2)" }}>Tên Nền tảng</label>
              <input className="form-input" defaultValue="SEAL Hackathon Hub" style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)" }} />
            </div>
          </div>

          <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <Shield size={18} style={{ color: "var(--color-primary)" }} /> Bảo mật Quản trị viên
            </h3>
            <div className="form-group">
              <label className="form-label" style={{ color: "var(--color-text-2)" }}>Xác thực Hai yếu tố cho Quản trị viên (2FA)</label>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.5rem" }}>
                <button className="btn btn-secondary">Bắt buộc 2FA cho tất cả Quản trị viên</button>
              </div>
              <span style={{ fontSize: "0.85rem", color: "var(--color-text-3)", display: "block", marginTop: "0.75rem" }}>
                Yêu cầu tất cả quản trị viên sử dụng ứng dụng xác thực.
              </span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
            <Bell size={18} style={{ color: "var(--color-primary)" }} /> Định tuyến Thông báo
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {[
              "Thông báo cho Quản trị viên khi có người đăng ký mới", 
              "Thông báo cho Quản trị viên khi có đội thi được tạo", 
              "Nhận báo cáo tóm tắt hàng ngày",
              "Gửi cảnh báo khi tiêu chí đánh giá thay đổi"
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
            <Save size={16} style={{ marginRight: 6 }} /> Lưu Tất cả Thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
