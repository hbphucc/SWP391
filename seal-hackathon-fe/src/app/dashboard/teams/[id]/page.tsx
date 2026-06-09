"use client";
import { useState, useEffect, use } from "react";
import { ChevronLeft, Users, UserPlus, LogOut, Crown, Mail, UserMinus, Target, CheckCircle, Search, Star, Zap, UserCheck, Shield, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { message, notification, Modal, Select } from "antd";

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const teamId = resolvedParams.id;
  const [tab, setTab] = useState("members");
  const [inviteEmail, setInviteEmail] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDisqualifyModalOpen, setIsDisqualifyModalOpen] = useState(false);
  const [disqualifyReason, setDisqualifyReason] = useState("");
  const [teamData, setTeamData] = useState<any>({
    id: 1, name: "CodeCraft", track: "AI & Machine Learning", status: "active",
    event: "SEAL Spring 2026", registeredAt: "Apr 10, 2026",
    members: [
      { id: "USR-001", name: "Hải Trần", email: "hai@student.fpt.edu.vn", role: "Leader", university: "FPT", studentId: "SE123456", joined: "Apr 10", skills: ["React", "Node.js"] },
      { id: "USR-002", name: "Le Thi B", email: "b.lt@fpt.edu.vn", role: "Member", university: "FPT", studentId: "SE123457", joined: "Apr 10", skills: ["Figma"] },
    ],
  });

  // Matchmaking State
  const [searchSkill, setSearchSkill] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  
  // Mentors State
  const [mentors, setMentors] = useState<any[]>([]);

  // Leave Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [newLeaderId, setNewLeaderId] = useState("");

  useEffect(() => {
    const user = (localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser"));
    if (user) {
      const parsed = JSON.parse(user);
      setCurrentUser(parsed);
      if (parsed.role === "Admin") setIsAdmin(true);
    }
  }, []);

  const handleMatchmakingSearch = async () => {
    try {
      const url = searchSkill 
        ? `/Matchmaking/free-agents?skill=${encodeURIComponent(searchSkill)}`
        : `/Matchmaking/free-agents`;
      const results = await apiRequest<any[]>(url);
      setMatches(results);
    } catch (err: any) {
      message.error("Tìm đội thất bại: " + err.message);
    }
  };

  const handleAutoFindMentors = () => {
    message.loading("Đang phân tích kỹ năng nhóm và tìm cố vấn phù hợp...", 1.5).then(() => {
      setMentors([
        { id: "MEN-1", name: "Dr. Nguyen", expertise: "AI/ML, Python", match: "98%" },
        { id: "MEN-2", name: "Mr. Tran", expertise: "System Design", match: "85%" }
      ]);
      message.success("Đã tìm thấy cố vấn phù hợp dựa trên hạng mục của bạn!");
    });
  };

  const handleInvite = async (target: string) => {
    const emailToAdd = target.includes('@') ? target : `${target.toLowerCase().replace(' ', '')}@example.com`;
    message.loading({ content: `Đang gửi email mời tham gia đến ${emailToAdd}...`, key: "inviteEmail" });
    
    try {
      await apiRequest(`/teams/${teamId}/send-invite-email`, {
        method: "POST",
        body: JSON.stringify({ email: emailToAdd })
      });
      message.success({ content: `Đã gửi email mời thành công đến ${emailToAdd}!`, key: "inviteEmail", duration: 5 });
      setInviteEmail("");
    } catch (e: any) {
      message.error({ content: `Không thể gửi email: ${e.message}`, key: "inviteEmail", duration: 5 });
    }
  };

  // 2. CHỨC NĂNG "CẤU CỨU MENTOR" (SOS MENTOR)
  const handleSOSMentor = () => {
    message.loading({ content: "Đang phát tín hiệu SOS tới tất cả cố vấn khả dụng...", key: "sos" });
    
    setTimeout(() => {
      const availableMentors = ["Dr. Pham", "Prof. Le", "Mr. Hoang", "Ms. Nguyen"];
      const mentorName = availableMentors[Math.floor(Math.random() * availableMentors.length)];
      
      message.success({ content: `${mentorName} đã phản hồi tín hiệu SOS và tham gia hỗ trợ đội của bạn!`, key: "sos", duration: 5 });
      
      setTeamData((prev: any) => ({
        ...prev,
        members: [
          ...prev.members, 
          { 
            id: `MEN-SOS-${Date.now()}`, 
            name: mentorName, 
            email: "expert.mentor@seal.edu", 
            role: "Mentor (SOS)", 
            university: "Faculty", 
            joined: "Just now", 
            skills: ["Technical Advising", "System Architecture"] 
          }
        ]
      }));
    }, 2500);
  };

  const handleLeaveTeam = () => {
    const isLeader = teamData.members.find((m: any) => m.id === currentUser?.id)?.role === "Leader";
    if (isLeader && teamData.members.length > 1) {
      setIsLeaveModalOpen(true);
    } else {
      message.success("Bạn đã rời đội thi.");
      // Redirect or update DB
    }
  };

  const confirmLeave = () => {
    if (!newLeaderId) {
      message.error("Vui lòng chọn trưởng đội mới.");
      return;
    }
    message.success("Đã chỉ định trưởng đội mới và rời đội thi thành công.");
    setIsLeaveModalOpen(false);
  };

  const handleDisqualify = () => {
    if (!disqualifyReason.trim()) {
      message.error("Vui lòng cung cấp lý do loại đội thi.");
      return;
    }
    setTeamData({ ...teamData, status: "disqualified" });
    message.success("Đội thi đã bị loại.");
    setIsDisqualifyModalOpen(false);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/teams"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{teamData.name}</h1>
            {teamData.status === "disqualified" ? (
              <span className="badge badge-danger" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>Bị loại</span>
            ) : (
              <span className="badge badge-success">Đang hoạt động</span>
            )}
          </div>
          <p className="page-subtitle">
            <Target size={13} style={{ marginRight: 4 }} />{teamData.track} · {teamData.event}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-primary btn-sm" onClick={handleSOSMentor} style={{ background: "#ef4444", color: "white", border: "none" }}>
            <AlertTriangle size={14} /> SOS Mentor
          </button>
          {isAdmin && teamData.status !== "disqualified" && (
            <button className="btn btn-danger btn-sm" onClick={() => setIsDisqualifyModalOpen(true)}>
              <Shield size={14} /> Loại đội thi
            </button>
          )}
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["members", "invite", "matchmaking", "mentors"].map(t => (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {t === "members" ? "Thành viên" : t === "invite" ? "Mời tham gia" : t === "matchmaking" ? "Tìm đồng đội" : t === "mentors" ? "Cố vấn" : t}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <div className="glass-card">
          <div className="section-header" style={{ marginBottom: "1rem" }}>
            <span className="section-title"><Users size={15} /> Thành viên Đội thi</span>
            {teamData.members.some((m:any) => m.id === currentUser?.id) && (
              <button className="btn btn-danger btn-sm" onClick={handleLeaveTeam}>
                <LogOut size={14} /> Rời Đội thi
              </button>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {teamData.members.map((m: any) => (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "rgba(15,23,42,0.5)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)" }}>
                <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "0.9rem", flexShrink: 0 }}>{m.name[0]}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                    <strong style={{ fontSize: "0.875rem" }}>{m.name}</strong>
                    {m.role === "Leader" && <span className="badge badge-warning" style={{ fontSize: "0.68rem" }}><Crown size={9} /> Trưởng đội</span>}
                    {m.role.includes("Mentor") && <span className="badge badge-success" style={{ fontSize: "0.68rem" }}><Star size={9} /> Cố vấn</span>}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{m.email} · {m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "matchmaking" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Zap size={18} style={{ display:'inline', marginRight: 8, color: '#f59e0b' }}/> Ghép đội thông minh</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Tìm kiếm các kỹ năng cụ thể mà đội của bạn đang thiếu và gửi lời mời.</p>
          
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <input className="form-input" style={{ flex: 1 }} placeholder="Tìm kiếm theo kỹ năng (VD: React, Python, UI/UX)..." value={searchSkill} onChange={e => setSearchSkill(e.target.value)} />
            <button className="btn btn-primary" onClick={handleMatchmakingSearch}><Search size={16} /> Tìm kiếm</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {matches.map(m => (
              <div key={m.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.name} <span className="badge badge-primary">{m.matchPercentage}% Phù hợp</span></h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Vai trò: {m.role} · Kỹ năng: {m.skills.join(", ")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "4px" }}>Lý do: {m.matchReasons?.join(", ")}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.name)}><UserPlus size={14} /> Gửi lời mời</button>
              </div>
            ))}
            {matches.length === 0 && <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>Hãy thử tìm kiếm một kỹ năng để xem gợi ý.</div>}
          </div>
        </div>
      )}

      {tab === "mentors" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Star size={18} style={{ display:'inline', marginRight: 8, color: '#6366f1' }}/> Tự động tìm Cố vấn</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>AI của chúng tôi sẽ gợi ý các cố vấn phù hợp nhất dựa trên hạng mục dự án của đội thi ({teamData.track}).</p>
          
          {mentors.length === 0 ? (
            <button className="btn btn-primary" onClick={handleAutoFindMentors}><Zap size={16}/> Tự động tìm Cố vấn</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {mentors.map(m => (
                <div key={m.id} style={{ padding: "1rem", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.name} <span className="badge badge-success">{m.match} Phù hợp</span></h4>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Chuyên môn: {m.expertise}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.name)}><UserCheck size={14} /> Yêu cầu Cố vấn</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "invite" && (
        <div className="glass-card" style={{ maxWidth: 520 }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>Mời thành viên qua Email</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>Gửi trực tiếp email mời một sinh viên tham gia đội thi của bạn.</p>
          <div className="form-group">
            <label className="form-label">Địa chỉ Email</label>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <input className="form-input" type="email" placeholder="student@university.edu" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <button className="btn btn-primary" disabled={!inviteEmail} onClick={() => handleInvite(inviteEmail)}><Mail size={15} /> Gửi lời mời</button>
            </div>
          </div>
        </div>
      )}

      <Modal title="Chỉ định Trưởng đội mới" open={isLeaveModalOpen} onOk={confirmLeave} onCancel={() => setIsLeaveModalOpen(false)}>
        <p style={{ marginBottom: 16 }}>Là trưởng đội, bạn phải chỉ định một trưởng đội mới trước khi rời đi.</p>
        <Select 
          style={{ width: '100%' }} 
          placeholder="Chọn một thành viên" 
          onChange={(val) => setNewLeaderId(val)}
          options={teamData.members.filter((m:any) => m.id !== currentUser?.id).map((m:any) => ({ value: m.id, label: m.name }))}
        />
      </Modal>

      <Modal 
        title={<div style={{ color: "#ef4444", display: "flex", alignItems: "center", gap: 8 }}><Shield size={18} /> Loại đội thi</div>} 
        open={isDisqualifyModalOpen} 
        onOk={handleDisqualify} 
        onCancel={() => setIsDisqualifyModalOpen(false)}
        okText="Xác nhận loại"
        okButtonProps={{ danger: true }}
      >
        <p style={{ marginBottom: 16 }}>Bạn đang chuẩn bị loại <strong>{teamData.name}</strong>. Hành động này sẽ thu hồi quyền nộp dự án của họ.</p>
        <div className="form-group">
          <label className="form-label">Lý do Loại <span style={{ color: "#ef4444" }}>*</span></label>
          <textarea 
            className="form-textarea" 
            rows={3} 
            placeholder="VD: Đạo văn, vi phạm điều khoản..." 
            value={disqualifyReason}
            onChange={(e) => setDisqualifyReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
