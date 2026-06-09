import Link from "next/link";
import { Users, BookOpen, Clock } from "lucide-react";

export default function MentorDashboardPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Tổng quan Cố vấn</h1>
          <p className="page-subtitle">Chào mừng trở lại! Quản lý các đội thi được phân công và đánh giá của bạn.</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        <Link href="/mentor/teams" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}><Users size={24} /></div>
          <div>
            <div className="stat-value">Đội thi của tôi</div>
            <div className="stat-label">Xem và đánh giá các đội thi được phân công</div>
          </div>
        </Link>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><BookOpen size={24} /></div>
          <div>
            <div className="stat-value">Hướng dẫn</div>
            <div className="stat-label">Đọc hướng dẫn cho cố vấn</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Clock size={24} /></div>
          <div>
            <div className="stat-value">Lịch trình</div>
            <div className="stat-label">Các buổi đánh giá sắp tới</div>
          </div>
        </div>
      </div>
    </div>
  );
}
