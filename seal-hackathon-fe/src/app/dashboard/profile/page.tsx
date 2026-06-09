"use client";
import { useState, useEffect } from "react";
import { User, Save, Upload, Mail, Book, GraduationCap, MapPin, Target, Code } from "lucide-react";
import { App } from "antd";

export default function ProfilePage() {
  const { message } = App.useApp();
  const [user, setUser] = useState<any>({
    name: "Đang tải...",
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
        message.success("Cập nhật ảnh đại diện thành công!");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Hồ sơ của tôi</h1>
          <p className="page-subtitle">Quản lý thông tin cá nhân và tùy chọn của bạn</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start", flexWrap: "wrap", overflowY: "auto", paddingRight: "0.5rem", paddingBottom: "2rem", flex: 1 }}>
        {/* Avatar Section */}
        <div className="glass-card" style={{ flex: "1 1 250px", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", textAlign: "center" }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Ảnh đại diện" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--color-primary)", padding: "4px", background: "rgba(255,255,255,0.05)" }} />
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
            <Upload size={14} style={{ marginRight: 4 }} /> Thay đổi ảnh đại diện
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarUpload} />
          </label>
        </div>

        {/* Profile Info Form */}
        <div className="glass-card" style={{ flex: "2 1 400px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label"><User size={13} style={{ display: 'inline', marginRight: 4 }} /> Họ và tên</label>
                <input className="form-input" value={user.name || ""} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} style={{ display: 'inline', marginRight: 4 }} /> Địa chỉ Email</label>
                <input className="form-input" type="email" value={user.email || ""} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
              </div>
            </div>

            <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label"><Book size={13} style={{ display: 'inline', marginRight: 4 }} /> Trường đại học</label>
                <input className="form-input" value={user.schoolName || user.university || ""} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label"><GraduationCap size={13} style={{ display: 'inline', marginRight: 4 }} /> Mã sinh viên</label>
                <input className="form-input" value={user.studentCode || user.studentId || ""} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
              </div>
            </div>

            <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
              <div className="form-group">
                <label className="form-label"><Target size={13} style={{ display: 'inline', marginRight: 4 }} /> Loại sinh viên</label>
                <input className="form-input" value={user.studentType || "Nội bộ"} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
              </div>
              <div className="form-group">
                <label className="form-label"><Code size={13} style={{ display: 'inline', marginRight: 4 }} /> Kỹ năng</label>
                <input className="form-input" value={user.skills || "Chưa xác định"} disabled style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--color-border-1)", opacity: 0.7 }} />
              </div>
            </div>

            <div style={{ marginTop: "1rem", color: "var(--color-text-3)", fontSize: "0.85rem", textAlign: "right" }}>
              Thông tin hồ sơ được quản lý bởi quản trị viên hệ thống.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

