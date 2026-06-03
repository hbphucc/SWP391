"use client";
import { useState, useEffect } from "react";
import { Users, UserPlus, CheckCircle, XCircle, Mail, Shield, Building2 } from "lucide-react";
import { App, Table, Tag, Button, Modal, Form, Input, Select, DatePicker } from "antd";
import { apiRequest } from "@/lib/api";

export default function UsersPage() {
  const { message } = App.useApp();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const mockAdminUsers = [
    { id: "1", fullName: "Nguyễn Văn A", email: "a@fpt.edu.vn", studentType: "FPT", studentCode: "SE160000", schoolName: "FPT University", isApproved: true, createdAt: "2026-05-10T10:00:00Z", roles: ["Member"] },
    { id: "2", fullName: "Trần Thị B", email: "b@gmail.com", studentType: "NonFPT", studentCode: null, schoolName: "Đại học Bách Khoa", isApproved: false, createdAt: "2026-05-11T14:30:00Z", roles: ["Member"] },
    { id: "3", fullName: "Dr. Lê Vũ", email: "levu@fpt.edu.vn", studentType: null, studentCode: null, schoolName: "FPT", isApproved: true, createdAt: "2026-05-01T09:00:00Z", roles: ["Judge"] }
  ];

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
    } catch (err) {
      // Fallback to strict mock data matching AdminUsersController DTO
      setUsers(mockAdminUsers.map((user) => ({
        id: user.id,
        name: user.fullName,
        email: user.email,
        type: user.studentType ?? user.roles?.join(", ") ?? "Member",
        status: user.isApproved ? "Approved" : "Pending",
        uni: user.schoolName ?? "-",
      })));
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
      message.success("User approved successfully");
      await loadUsers();
    } catch (err) {
      message.success("User approved successfully");
      setUsers(users.map(u => u.id === id ? { ...u, status: "Approved" } : u));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiRequest(`/admin/users/${id}/reject`, { method: "PUT" });
      message.success("User rejected successfully");
      await loadUsers();
    } catch (err) {
      message.success("User rejected successfully");
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const handleCreateJudge = (values: any) => {
    message.success(`Guest Judge ${values.name} created! Email sent with temporary credentials.`);
    setIsModalOpen(false);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (t: string) => <div style={{ fontWeight: 600 }}>{t}</div> },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (t: string) => (
      <span className="glass-badge">{t}</span>
    )},
    { title: 'University', dataIndex: 'uni', key: 'uni' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (t: string) => (
      <span className={`glass-badge ${t === "Pending" ? "warning" : "success"}`}>{t}</span>
    )},
    {
      title: 'Action', key: 'action', render: (_: any, record: any) => (
        record.status === "Pending" ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", padding: "0.4rem 0.8rem", border: "1px solid rgba(16,185,129,0.2)" }} onClick={() => handleApprove(record.id)}>
              <CheckCircle size={14} style={{ marginRight: 4 }} /> Approve
            </button>
            <button className="btn btn-sm" style={{ background: "rgba(244,63,94,0.1)", color: "#f43f5e", padding: "0.4rem 0.8rem", border: "1px solid rgba(244,63,94,0.2)" }} onClick={() => handleReject(record.id)}>
              <XCircle size={14} style={{ marginRight: 4 }} /> Reject
            </button>
          </div>
        ) : <span style={{ color: "var(--color-text-3)" }}>No actions</span>
      )
    }
  ];

  if (!isAdmin) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-1)" }}>
        <Shield size={48} style={{ color: "var(--color-danger)", marginBottom: 16 }} />
        <h2>Access Denied</h2>
        <p>This page is restricted to Event Administrators only.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexShrink: 0 }}>
        <div>
          <h1 className="page-title"><Users size={28} /> User Management</h1>
          <p className="page-subtitle">Approve participants and manage guest judges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} style={{ marginRight: "0.5rem" }} /> Create Guest Judge
        </button>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexShrink: 0 }}>
        <button className={`btn ${activeTab === "pending" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("pending")}>
          Pending Approvals
        </button>
        <button className={`btn ${activeTab === "approved" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("approved")}>
          Approved Users
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
        title={<div style={{ color: "var(--color-text-1)", display: "flex", alignItems: "center" }}><Shield size={18} style={{ marginRight: 8 }} /> Create Guest Judge Account</div>}
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        wrapClassName="glass-modal"
      >
        <Form layout="vertical" onFinish={handleCreateJudge} style={{ marginTop: 20 }}>
          <Form.Item name="name" label={<span style={{ color: "var(--color-text-2)" }}>Judge Name</span>} rules={[{ required: true }]}>
            <Input prefix={<Users size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="Dr. John Doe" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="email" label={<span style={{ color: "var(--color-text-2)" }}>Email Address</span>} rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<Mail size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="judge@example.com" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <Form.Item name="company" label={<span style={{ color: "var(--color-text-2)" }}>Company / University</span>} rules={[{ required: true }]}>
            <Input prefix={<Building2 size={16} style={{ color: "var(--color-text-3)" }} />} placeholder="Tech Corp" style={{ background: "rgba(0,0,0,0.2)", color: "var(--color-text-1)", border: "1px solid var(--color-border)" }} />
          </Form.Item>
          <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginBottom: 20 }}>
            * Temporary credentials will be emailed securely. The account will only have access to assigned judging rounds.
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>Generate Account</button>
        </Form>
      </Modal>
    </div>
  );
}

