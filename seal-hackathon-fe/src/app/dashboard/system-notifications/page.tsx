"use client";
import { AlertTriangle, Info, CheckCircle } from "lucide-react";

export default function SystemNotificationsPage() {
  const alerts = [
    { type: "warning", message: "Phát hiện tải máy chủ cao trong quá trình đăng ký đội thi.", time: "2 giờ trước" },
    { type: "info", message: "Sao lưu cơ sở dữ liệu hoàn tất thành công.", time: "5 giờ trước" },
    { type: "success", message: "Đã triển khai bản cập nhật hệ thống v1.2.0.", time: "1 ngày trước" },
  ];

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cảnh báo hệ thống</h1>
          <p className="page-subtitle">Tình trạng nền tảng và các thông báo toàn hệ thống</p>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem", background: "rgba(15,23,42,0.4)", borderRadius: "var(--radius-md)", borderLeft: `3px solid ${a.type === 'warning' ? '#f59e0b' : a.type === 'success' ? '#10b981' : '#3b82f6'}` }}>
              {a.type === "warning" ? <AlertTriangle style={{ color: "#f59e0b" }} /> : a.type === "success" ? <CheckCircle style={{ color: "#10b981" }} /> : <Info style={{ color: "#3b82f6" }} />}
              <div>
                <div style={{ fontWeight: 600 }}>{a.message}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
