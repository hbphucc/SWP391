"use client";
import { useState, useEffect } from "react";
import { Users, FileEdit, MessageSquare, Check, X, BellRing } from "lucide-react";
import { App, Modal, Input } from "antd";

import { apiRequest } from "@/lib/api";

export default function MentorTeamsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [note, setNote] = useState("");
  const [notesDB, setNotesDB] = useState<Record<string, string>>({});

  const fetchTeamsAndInvitations = async () => {
    try {
      const [teamsData, invitesData] = await Promise.all([
        apiRequest<any[]>("/teams/mentor"),
        apiRequest<any[]>("/teams/invitations").catch(() => [])
      ]);
      setTeams(teamsData);
      setInvitations(invitesData || []);
    } catch (err: any) {
      message.error("Lỗi khi tải dữ liệu đội thi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndInvitations();
  }, []);

  const handleAccept = async (inviteTeamId: string) => {
    try {
      message.loading({ content: "Đang xử lý...", key: "invite" });
      await apiRequest(`/Matchmaking/available-teams/${inviteTeamId}/join`, { method: "POST" });
      message.success({ content: "Đã đồng ý tham gia đội!", key: "invite" });
      fetchTeamsAndInvitations();
    } catch (err: any) {
      message.error({ content: err.message || "Lỗi khi đồng ý gia nhập", key: "invite" });
    }
  };

  const handleReject = async (inviteTeamId: string) => {
    try {
      message.loading({ content: "Đang xử lý...", key: "invite" });
      await apiRequest(`/teams/invitations/${inviteTeamId}`, { method: "DELETE" });
      message.success({ content: "Đã từ chối lời mời", key: "invite" });
      fetchTeamsAndInvitations();
    } catch (err: any) {
      message.error({ content: err.message || "Lỗi khi từ chối", key: "invite" });
    }
  };

  const openReview = (team: any) => {
    setSelectedTeam(team);
    setNote(notesDB[team.id] || "");
    setReviewModal(true);
  };

  const handleSaveNote = () => {
    if (!selectedTeam) return;
    setNotesDB({ ...notesDB, [selectedTeam.id]: note });
    setReviewModal(false);
    message.success("Đã lưu ghi chú đánh giá thành công!");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Đội thi & Lời mời</h1>
          <p className="page-subtitle">Quản lý các đội thi bạn đang hướng dẫn và lời mời tham gia</p>
        </div>
      </div>

      {invitations.length > 0 && (
        <div className="glass-card" style={{ marginTop: "2rem", borderLeft: "4px solid #f59e0b" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <BellRing size={18} style={{ color: "#f59e0b" }} /> 
            Lời mời đang chờ ({invitations.length})
          </h3>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Tên Đội gửi mời</th>
                  <th>Hạng mục</th>
                  <th>Thời gian gửi</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((inv) => (
                  <tr key={inv.inviteTeamId}>
                    <td className="table-cell-primary">{inv.teamName}</td>
                    <td><span className="badge badge-neutral">{inv.track}</span></td>
                    <td><span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{new Date(inv.createdAt).toLocaleDateString("vi-VN")}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => handleAccept(inv.inviteTeamId)}>
                          <Check size={14} /> Đồng ý
                        </button>
                        <button className="btn btn-ghost danger btn-sm" onClick={() => handleReject(inv.inviteTeamId)}>
                          <X size={14} /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="table-wrapper" style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "1rem", marginLeft: "1rem", marginTop: "1rem" }}>Danh sách đội thi đang hướng dẫn</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Tên Đội thi</th>
              <th>Hạng mục</th>
              <th>Thành viên</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.id}>
                <td className="table-cell-primary">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                      {t.name.substring(0,2).toUpperCase()}
                    </div>
                    {t.name}
                  </div>
                </td>
                <td><span style={{ fontSize: "0.8rem" }}>{t.track}</span></td>
                <td><span className="badge badge-neutral"><Users size={10} /> {t.members}</span></td>
                <td><span className="badge badge-success">{t.status.toUpperCase()}</span></td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => openReview(t)}>
                    {notesDB[t.id] ? <MessageSquare size={13} /> : <FileEdit size={13} />}
                    {notesDB[t.id] ? " Sửa Ghi chú" : " Thêm Ghi chú"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={`Ghi chú đánh giá cho ${selectedTeam?.name}`}
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        onOk={handleSaveNote}
        okText="Lưu Ghi chú"
      >
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1rem" }}>Viết lời khuyên, phản hồi và ghi chú của bạn cho đội thi này.</p>
          <Input.TextArea 
            rows={6} 
            placeholder="Nhập ghi chú của bạn tại đây..." 
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
