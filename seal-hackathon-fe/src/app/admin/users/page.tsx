"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, CheckCircle, XCircle, Mail, Shield, Building2, Star } from "lucide-react";
import { App, Table, Tag, Button, Modal, Form, Input, Select, DatePicker } from "antd";
import { apiRequest } from "@/lib/api";

export default function UsersPage() {
  const { message } = App.useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/admin/users");
      setUsers(data.map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        type: user.studentType ?? user.roles?.join(", ") ?? "Member",
        status: user.isApproved ? "Approved" : "Pending",
        uni: user.schoolName ?? "-",
      })));
    } catch (err: any) {
      message.error(err.message || "Tải danh sách người dùng thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = (localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser"));
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user.roles?.includes("Admin") || user.role === "Admin") setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadUsers();
  }, [isAdmin]);

  const handleApprove = async (id: string) => {
    try {
      await apiRequest(`/admin/users/${id}/approve`, { method: "PUT" });
      message.success("Đã duyệt người dùng");
      await loadUsers();
    } catch (err: any) {
      message.error(err.message || "Duyệt người dùng thất bại");
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/admin/users/${id}/reject`, { method: "PUT" });
      message.success("Đã từ chối người dùng");
      await loadUsers();
    } catch (err: any) {
      message.error(err.message || "Từ chối người dùng thất bại");
    }
  };

  const handleCreateJudge = async (values: any) => {
    try {
      const res = await apiRequest<any>("/admin/users/judge", {
        method: "POST",
        body: JSON.stringify(values)
      });
      message.success(`Tạo tài khoản Giám khảo ${values.name} thành công! Mật khẩu tạm thời: ${res.tempPassword}`);
      setIsModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      message.error(err.message || "Tạo tài khoản Giám khảo thất bại");
    }
  };

  const handleCreateMentor = async (values: any) => {
    try {
      const res = await apiRequest<any>("/admin/users/mentor", {
        method: "POST",
        body: JSON.stringify(values)
      });
      message.success(`Tạo tài khoản Cố vấn ${values.name} thành công! Mật khẩu tạm thời: ${res.tempPassword}`, 8);
      setIsMentorModalOpen(false);
      await loadUsers();
    } catch (err: any) {
      message.error(err.message || "Tạo tài khoản Cố vấn thất bại");
    }
  };

  const columns = [
    { title: 'Họ tên', dataIndex: 'name', key: 'name', render: (t: string) => <div style={{ fontWeight: 600 }}>{t}</div> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Loại', dataIndex: 'type', key: 'type', render: (t: string) => (
      <span className="glass-badge">{t === "Member" ? "Thành viên" : t}</span>
    )},
    { title: 'Trường Đại học', dataIndex: 'uni', key: 'uni' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: (t: string) => (
      <span className={`glass-badge ${t === "Pending" ? "warning" : "success"}`}>{t === "Pending" ? "Chờ duyệt" : "Đã duyệt"}</span>
    )},
    {
      title: 'Thao tác', key: 'action', render: (_: any, record: any) => (
        record.status === "Pending" ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", padding: "0.4rem 0.8rem", border: "1px solid rgba(16,185,129,0.2)" }} onClick={() => handleApprove(record.id)}>
              <CheckCircle size={14} style={{ marginRight: 4 }} /> Duyệt
            </button>
            <button className="btn btn-sm" style={{ background: "rgba(244,63,94,0.1)", color: "#f43f5e", padding: "0.4rem 0.8rem", border: "1px solid rgba(244,63,94,0.2)" }} onClick={() => handleReject(record.id)}>
              <XCircle size={14} style={{ marginRight: 4 }} /> Từ chối
            </button>
          </div>
        ) : <span style={{ color: "var(--color-text-3)" }}>Không có thao tác</span>
      )
    }
  ];

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-1)" }}>
        <Shield size={48} style={{ color: "var(--color-danger)", marginBottom: 16 }} />
        <h2>Truy cập bị từ chối</h2>
        <p>Trang này chỉ dành cho Quản trị viên của Sự kiện.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <div>
          <h1 className="page-title"><Users size={28} /> Quản lý Người dùng</h1>
          <p className="page-subtitle">Phê duyệt người tham gia và quản lý tài khoản Giám khảo, Cố vấn</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsMentorModalOpen(true)} style={{ color: "#6366f1", borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)" }}>
            <UserPlus size={16} style={{ marginRight: "0.5rem" }} /> Tạo Cố vấn
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <UserPlus size={16} style={{ marginRight: "0.5rem" }} /> Tạo Giám khảo
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexShrink: 0 }}>
        <button className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("pending")}>
          Chờ phê duyệt
        </button>
        <button className={`btn ${activeTab === "approved" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("approved")}>
          Đã phê duyệt
        </button>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowY: "auto", flex: 1 }}>
        <Table 
          className="custom-antd-table"
          dataSource={activeTab === "pending" ? users.filter(u => u.status === "Pending") : users.filter(u => u.status === "Approved")} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={false}
        />
      </div>

      <Modal 
        title={<div style={{ color: "var(--color-text-1)", display: "flex", alignItems: "center" }}><Shield size={18} style={{ marginRight: 8 }} /> Tạo tài khoản Giám khảo</div>}
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        wrapClassName="glass-modal"
      >
        <Form layout="vertical" onFinish={handleCreateJudge} style={{ marginTop: 20 }}>
          <Form.Item name="name" label={<span style={{ color: "var(--color-text-2)" }}>Tên Giám khảo</span>} rules={[{ required: true }]}>
            <Input prefix={<Users size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="Nguyễn Văn A" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="email" label={<span style={{ color: "var(--color-text-2)" }}>Địa chỉ Email</span>} rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<Mail size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="giamkhao@example.com" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="company" label={<span style={{ color: "var(--color-text-2)" }}>Công ty / Trường Đại học</span>} rules={[{ required: true }]}>
            <Input prefix={<Building2 size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="Tập đoàn Công nghệ" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginBottom: 20 }}>
            * Thông tin đăng nhập tạm thời sẽ được gửi qua email. Tài khoản này chỉ có quyền truy cập vào các vòng thi được phân công.
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Tạo tài khoản</button>
        </Form>
      </Modal>

      <Modal 
        title={<div style={{ color: "var(--color-text-1)", display: "flex", alignItems: "center" }}><Star size={18} style={{ marginRight: 8, color: '#6366f1' }} /> Tạo tài khoản Cố vấn</div>}
        open={isMentorModalOpen} 
        onCancel={() => setIsMentorModalOpen(false)}
        footer={null}
        wrapClassName="glass-modal"
      >
        <Form layout="vertical" onFinish={handleCreateMentor} style={{ marginTop: 20 }}>
          <Form.Item name="name" label={<span style={{ color: "var(--color-text-2)" }}>Tên Cố vấn</span>} rules={[{ required: true }]}>
            <Input prefix={<Users size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="Trần Văn B" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="email" label={<span style={{ color: "var(--color-text-2)" }}>Địa chỉ Email</span>} rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<Mail size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="covan@example.com" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="company" label={<span style={{ color: "var(--color-text-2)" }}>Công ty / Trường Đại học</span>} rules={[{ required: true }]}>
            <Input prefix={<Building2 size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="Tập đoàn Công nghệ" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="skills" label={<span style={{ color: "var(--color-text-2)" }}>Kỹ năng chuyên môn (cách nhau bởi dấu phẩy)</span>} rules={[{ required: true }]}>
            <Input placeholder="Ví dụ: React, Node.js, AI, UX/UI" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginBottom: 20 }}>
            * Thông tin đăng nhập tạm thời sẽ được hiển thị ngay sau khi tạo. Cố vấn sẽ dùng kỹ năng trên để Matchmaking.
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%", background: "#6366f1", borderColor: "#6366f1" }}>Tạo tài khoản Cố vấn</button>
        </Form>
      </Modal>
    </div>
  );
}

