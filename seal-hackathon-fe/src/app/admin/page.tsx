import Link from "next/link";
import { Users, Shield, FileText } from "lucide-react";

export default function AdminDashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan Quản trị viên</h1>
          <p className="page-subtitle">Chào mừng đến với Cổng Quản trị Hệ thống SEAL</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <Link href="/admin/users" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}><Users size={24} /></div>
          <div>
            <div className="stat-value">Phê duyệt Người dùng</div>
            <div className="stat-label">Quản lý đăng ký và khách</div>
          </div>
        </Link>
        
        <Link href="/admin/criteria" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><FileText size={24} /></div>
          <div>
            <div className="stat-value">Mẫu Tiêu chí</div>
            <div className="stat-label">Cấu hình thang điểm đánh giá</div>
          </div>
        </Link>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Shield size={24} /></div>
          <div>
            <div className="stat-value">Cảnh báo Hệ thống</div>
            <div className="stat-label">Theo dõi trạng thái hệ thống</div>
          </div>
        </div>
      </div>
    </div>
  );
}
