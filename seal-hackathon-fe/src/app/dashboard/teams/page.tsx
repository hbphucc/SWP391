"use client";
import { useState, useEffect } from "react";
import { Plus, Users, Shield, LogOut, Search, Zap, UserPlus, Star, UserCheck, AlertTriangle, Mail, Crown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { App, Modal } from "antd";
import { apiRequest } from "@/lib/api";

export default function TeamsPage() {
  const router = useRouter();
  const { message, modal, notification } = App.useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);
  const [tab, setTab] = useState("members");
  const [emptyTab, setEmptyTab] = useState("create");
  const [newTeamName, setNewTeamName] = useState("");

  // Feature states
  const [inviteEmail, setInviteEmail] = useState("");
  const [searchSkill, setSearchSkill] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [joinSearch, setJoinSearch] = useState("");
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);

  useEffect(() => {
    const fetchAvailable = async () => {
      try {
        const teams = await apiRequest<any[]>("/Matchmaking/available-teams");
        setAvailableTeams(teams);
      } catch (err) {
        console.error(err);
      }
    };
    if (emptyTab === "join") fetchAvailable();
  }, [emptyTab]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const inviteTeamId = params.get("inviteTeamId");
      const teamName = params.get("teamName");

      if (inviteTeamId && teamName) {
        let rejectReason = "";
        modal.confirm({
          title: "Lời mời gia nhập đội thi",
          content: (
            <div>
              <p>Bạn nhận được lời mời gia nhập đội <strong>{teamName}</strong>. Bạn có muốn tham gia không?</p>
              <div style={{ marginTop: 15 }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--color-text-2)' }}>Nếu từ chối, vui lòng nhập lý do (tùy chọn):</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Tôi bận việc cá nhân..." 
                  onChange={(e) => { rejectReason = e.target.value; }}
                  style={{ width: '100%', marginTop: 5 }}
                />
              </div>
            </div>
          ),
          okText: "Đồng ý gia nhập",
          cancelText: "Từ chối",
          onOk: async () => {
            message.loading({ content: `Đang gia nhập đội ${teamName}...`, key: "invite" });
            try {
              await apiRequest(`/Matchmaking/available-teams/${inviteTeamId}/join`, { method: "POST" });
              message.success({ content: `Bạn đã gia nhập nhóm ${teamName} thành công!`, key: "invite", duration: 5 });
              fetchMyTeam();
              router.replace("/dashboard/teams");
            } catch (e: any) {
              message.error({ content: e.message || "Không thể gia nhập nhóm này.", key: "invite", duration: 5 });
            }
          },
          onCancel: async () => {
            message.loading({ content: "Đang gửi phản hồi từ chối...", key: "invite" });
            try {
              await apiRequest(`/Matchmaking/available-teams/${inviteTeamId}/reject-invite`, { 
                method: "POST",
                body: JSON.stringify({ reason: rejectReason })
              });
              message.success({ content: "Đã gửi thông báo từ chối đến nhóm.", key: "invite", duration: 5 });
              router.replace("/dashboard/teams");
            } catch (e: any) {
              message.error({ content: "Có lỗi xảy ra khi gửi phản hồi.", key: "invite", duration: 3 });
            }
          }
        });
      }
    }
  }, [modal, router]);

  const handleRequestJoin = async (team: any) => {
    message.loading({ content: `Đang gửi yêu cầu vào nhóm ${team.name}...`, key: "join" });
    try {
      await apiRequest(`/Matchmaking/available-teams/${team.id}/join`, { method: "POST" });
      message.success({ content: `Bạn đã gia nhập nhóm ${team.name} thành công!`, key: "join", duration: 5 });
      fetchMyTeam();
    } catch (e: any) {
      message.error({ content: e.message || "Không thể gia nhập nhóm này.", key: "join", duration: 5 });
    }
  };

  const fetchMyTeam = async () => {
    try {
      const team = await apiRequest<any>("/teams/my-team");
      setMyTeam(team);
    } catch (e: any) {
      setMyTeam(null);
    }
  };

  useEffect(() => {
    const user = JSON.parse((localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser")) || "{}");
    setCurrentUser(user);
    fetchMyTeam();
  }, []);

  const saveTeam = (updatedTeam: any) => {
    setMyTeam(updatedTeam);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      message.error("Vui lòng nhập tên nhóm!");
      return;
    }
    message.loading({ content: "Đang tạo nhóm...", key: "createTeam" });
    try {
      const events = await apiRequest<any[]>("/Events");
      if (events.length === 0) throw new Error("Chưa có sự kiện nào đang mở.");
      const eventId = events[0].eventId;

      const categories = await apiRequest<any[]>(`/Events/${eventId}/categories`);
      if (categories.length === 0) throw new Error("Sự kiện này chưa có hạng mục nào.");
      const categoryId = categories[0].categoryId;

      await apiRequest("/Teams", {
        method: "POST",
        body: JSON.stringify({
          teamName: newTeamName,
          categoryId: categoryId,
          memberIds: []
        })
      });
      message.success({ content: "Tạo nhóm thành công!", key: "createTeam" });
      setNewTeamName("");
      fetchMyTeam();
    } catch (e: any) {
      message.error({ content: e.message || "Lỗi khi tạo nhóm", key: "createTeam" });
    }
  };

  const handleKick = (email: string, name: string) => {
    if (!myTeam) return;

    const isLeader = myTeam.members.find((m:any) => m.email === currentUser.email)?.role === "Leader";
    if (!isLeader) {
      message.error("Chỉ có Leader mới được quyền kick thành viên!");
      return;
    }

    modal.confirm({
      title: "Loại thành viên",
      content: `Bạn có chắc chắn muốn loại ${name} khỏi đội thi?`,
      okText: "Có, Loại",
      okType: "danger",
      cancelText: "Hủy",
      onOk: () => {
        const updatedMembers = myTeam.members.filter((m:any) => m.email !== email);
        const updatedTeam = { ...myTeam, members: updatedMembers };
        saveTeam(updatedTeam);
        message.success("Đã loại thành viên khỏi đội thi.");
      }
    });
  };

  const handlePromote = (email: string, name: string) => {
    if (!myTeam) return;
    modal.confirm({
      title: "Chuyển quyền Trưởng đội",
      content: `Bạn có chắc muốn thăng cấp ${name} làm Trưởng đội? Bạn sẽ trở thành thành viên thường.`,
      okText: "Có, Thăng cấp",
      cancelText: "Hủy",
      onOk: () => {
        const updatedMembers = myTeam.members.map((m: any) => {
          if (m.email === email) return { ...m, role: "Leader" };
          if (m.email === currentUser.email) return { ...m, role: "Member" };
          return m;
        });
        const updatedTeam = { ...myTeam, members: updatedMembers };
        saveTeam(updatedTeam);
        message.success(`Đã chuyển quyền Trưởng đội cho ${name}.`);
      }
    });
  };

  const handleLeave = () => {
    if (!myTeam) return;
    const isLeader = myTeam.members.find((m:any) => m.email === currentUser.email)?.role === "Leader";
    const nonMentorMembers = myTeam.members.filter((m:any) => !m.role.includes("Mentor"));
    
    if (isLeader && nonMentorMembers.length > 1) {
      modal.warning({
        title: "Yêu cầu chuyển quyền Trưởng đội",
        content: "Bạn đang là Trưởng đội. Vui lòng thăng cấp một thành viên khác lên làm Trưởng đội trước khi rời đi.",
        okText: "Đã hiểu",
      });
    } else {
      modal.confirm({
        title: isLeader ? "Giải tán Đội thi" : "Rời Đội thi",
        content: isLeader ? "Bạn là thành viên chính thức duy nhất còn lại. Rời đi sẽ xóa hoàn toàn đội thi (bao gồm cả Cố vấn nếu có). Bạn có chắc không?" : "Bạn có chắc muốn rời đội thi không?",
        okText: isLeader ? "Giải tán" : "Rời đi",
        okType: "danger",
        onOk: async () => {
          try {
            message.loading({ content: "Đang xử lý...", key: "leave" });
            if (isLeader) {
              // Call API to delete team (Needs to be added if missing, assume /teams/{id} DELETE)
              await apiRequest(`/teams/${myTeam.teamId}`, { method: "DELETE" });
              setMyTeam(null);
              message.success({ content: "Đội thi đã giải tán.", key: "leave" });
            } else {
              // Call API to remove self
              const myUserId = myTeam.members.find((m:any) => m.email === currentUser.email)?.userId;
              await apiRequest(`/teams/${myTeam.teamId}/members/${myUserId}`, { method: "DELETE" });
              setMyTeam(null);
              message.success({ content: "Bạn đã rời đội thi.", key: "leave" });
            }
          } catch (err: any) {
             message.error({ content: err.message || "Lỗi khi rời đội thi", key: "leave" });
          }
        }
      });
    }
  };

  const handleInvite = async (target: string, isMentor: boolean = false) => {
    if (!myTeam) return;
    if (myTeam.members.length >= 5) {
      message.error("Đội thi đã đầy (tối đa 5 thành viên).");
      return;
    }

    if (isMentor) {
      const hasMentor = myTeam.members.some((m: any) => m.role?.includes("Mentor"));
      if (hasMentor) {
        message.error("Mỗi nhóm chỉ có thể kêu gọi 1 Mentor duy nhất!");
        return;
      }
    }

    const emailToAdd = target.includes('@') ? target : `${target.toLowerCase().replace(' ', '')}@example.com`;
    if (myTeam.members.some((m: any) => m.email === emailToAdd)) {
      message.error("Người dùng này đã có trong nhóm!");
      return;
    }
    
    message.loading({ content: `Đang gửi email mời tham gia đến ${emailToAdd}...`, key: "inviteEmail" });
    
    try {
      await apiRequest(`/teams/${myTeam.teamId}/send-invite-email`, {
        method: "POST",
        body: JSON.stringify({ email: emailToAdd })
      });
      message.success({ content: `Đã gửi email mời thành công đến ${emailToAdd}!`, key: "inviteEmail", duration: 5 });
      setInviteEmail("");
    } catch (e: any) {
      message.error({ content: `Không thể gửi email: ${e.message}`, key: "inviteEmail", duration: 5 });
    }
  };

  const handleMatchmakingSearch = async () => {
    if (!myTeam) return;
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

  const handleAutoFindMentors = async () => {
    message.loading({ content: "Phân tích kỹ năng nhóm và tìm Mentor phù hợp...", key: "findMentors" });
    try {
      const data = await apiRequest<any[]>("/Matchmaking/mentors");
      if (data.length > 0) {
        setMentors(data);
        message.success({ content: "Đã tìm thấy Mentor phù hợp với chuyên môn của nhóm!", key: "findMentors", duration: 3 });
      } else {
        message.info({ content: "Hiện tại chưa có Mentor nào phù hợp.", key: "findMentors", duration: 3 });
      }
    } catch (err: any) {
      message.error({ content: err.message || "Lỗi khi tìm kiếm Mentor", key: "findMentors", duration: 3 });
    }
  };

  const handleApproveMember = (email: string) => {
    const updatedMembers = myTeam.members.map((m: any) => m.email === email ? { ...m, status: "active" } : m);
    saveTeam({ ...myTeam, members: updatedMembers });
    message.success("Đã phê duyệt thành viên vào nhóm!");
  };

  const handleRejectMember = (email: string) => {
    const updatedMembers = myTeam.members.filter((m: any) => m.email !== email);
    saveTeam({ ...myTeam, members: updatedMembers });
    message.success("Đã từ chối thành viên.");
  };

  const handleSOSMentor = async () => {
    if (!myTeam) return;
    try {
      message.loading({ content: "Đang phát tín hiệu SOS...", key: "sos" });
      await apiRequest(`/teams/${myTeam.teamId}/sos-mentor`, { method: "POST" });
      message.success({ content: "Đã phát tín hiệu SOS khẩn cấp đến toàn bộ Cố vấn!", key: "sos", duration: 5 });
    } catch (err: any) {
      message.error({ content: err.message || "Lỗi khi phát tín hiệu SOS", key: "sos" });
    }
  };

  const isLeader = myTeam?.members?.find((m:any) => m.email === currentUser?.email)?.role === "Leader";

  if (!currentUser) return null;

  if (currentUser?.role?.toLowerCase()?.includes("judge")) {
    return <div style={{ padding: "2rem" }}>Tính năng này chỉ dành cho Thí sinh. Giám khảo không tham gia đội thi.</div>;
  }

  if (!myTeam) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div className="page-header" style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Users size={32} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="page-title" style={{ justifyContent: "center" }}>Bạn chưa tham gia đội thi nào</h1>
          <p className="page-subtitle">Tham gia một đội thi có sẵn hoặc tạo đội mới do bạn làm trưởng đội.</p>
        </div>

        <div className="tabs" style={{ marginBottom: "2rem", justifyContent: "center" }}>
          <button className={`tab-btn ${emptyTab==="create"?"active":""}`} onClick={() => setEmptyTab("create")}>
            <Crown size={16} style={{ marginRight: 6 }}/> Tạo đội thi
          </button>
          <button className={`tab-btn ${emptyTab==="join"?"active":""}`} onClick={() => setEmptyTab("join")}>
            <Search size={16} style={{ marginRight: 6 }}/> Tìm đội thi
          </button>
        </div>

        {emptyTab === "create" && (
          <div className="glass-card" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>Dẫn dắt Đội thi của bạn</h3>
            <p style={{ color: "var(--color-text-2)", marginBottom: "2rem" }}>Đứng ra chịu trách nhiệm, xác định tầm nhìn dự án và mời các sinh viên tài năng khác tham gia đội của bạn.</p>
            <input className="form-input" placeholder="Nhập tên nhóm của bạn..." value={newTeamName} onChange={e => setNewTeamName(e.target.value)} style={{ marginBottom: "1rem", width: "100%" }} />
            <button className="btn btn-primary btn-lg" onClick={handleCreateTeam} style={{ width: "100%", justifyContent: "center" }}>
              <Plus size={18} /> Tạo đội thi mới
            </button>
          </div>
        )}

        {emptyTab === "join" && (
          <div className="glass-card" style={{ maxWidth: 700, margin: "0 auto" }}>
            <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
              <input 
                className="form-input" 
                style={{ flex: 1 }} 
                placeholder="Tìm kiếm đội thi theo tên, hạng mục hoặc kỹ năng yêu cầu..." 
                value={joinSearch} 
                onChange={e => setJoinSearch(e.target.value)} 
              />
              <button className="btn btn-primary"><Search size={16} /> Tìm kiếm</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {(() => {
                const filteredTeams = availableTeams.filter((t: any) => 
                  t.name?.toLowerCase().includes(joinSearch.toLowerCase()) || 
                  t.track?.toLowerCase().includes(joinSearch.toLowerCase()) ||
                  (t.lookingFor && t.lookingFor.some((s: string) => s.toLowerCase().includes(joinSearch.toLowerCase())))
                );

                if (filteredTeams.length === 0) {
                  return (
                    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--color-text-3)", background: "rgba(255,255,255,0.02)", borderRadius: "var(--radius-md)", border: "1px dashed var(--color-border)" }}>
                      <Search size={32} style={{ opacity: 0.3, marginBottom: "1rem" }} />
                      <div style={{ fontSize: "1.1rem" }}>Không có nhóm này tồn tại.</div>
                      <div style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Vui lòng thử từ khóa khác hoặc tự tạo nhóm cho riêng mình.</div>
                    </div>
                  );
                }

                return filteredTeams.map((t: any) => (
                  <div key={t.id} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem" }}>{t.name} <span className="badge badge-neutral">{t.membersCount}/5 Thành viên</span></h4>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "4px" }}>
                        Hạng mục: <strong>{t.track}</strong>
                        <span className={`badge ${t.joinMode === "auto" ? "badge-success" : "badge-warning"}`} style={{ marginLeft: "0.5rem" }}>
                          {t.joinMode === "auto" ? "Tự động duyệt" : "Cần duyệt"}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#10b981" }}>Đang tìm kiếm: {t.lookingFor?.join(", ")}</div>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => handleRequestJoin(t)}><UserPlus size={14} /> Yêu cầu tham gia</button>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}
      </div>
    );
  }


  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{myTeam.teamName}</h1>
          <p className="page-subtitle">{myTeam.description}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {isLeader && (
            <button className="btn btn-warning btn-sm" onClick={handleSOSMentor} style={{ background: "#ef4444", color: "white", border: "none" }}>
              <AlertTriangle size={14} /> SOS Mentor
            </button>
          )}
          <button className="btn btn-ghost danger" onClick={handleLeave}>
            <LogOut size={16} /> Rời Đội thi
          </button>
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
        <div className="glass-card" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} />
              Thành viên Đội thi ({myTeam.members.length}/5)
            </h3>
            <span className={`badge ${myTeam.status === "pending" ? "badge-warning" : "badge-success"}`}>
              {myTeam.status.toUpperCase()}
            </span>
          </div>

          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Thành viên</th>
                  <th>Vai trò</th>
                  <th>Email</th>
                  {isLeader && <th style={{ textAlign: "right" }}>Hành động</th>}
                </tr>
              </thead>
              <tbody>
                {myTeam.members.map((m: any, idx: number) => (
                  <tr key={idx}>
                    <td className="table-cell-primary">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>
                          {m.fullName.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 500 }}>{m.fullName}</span>
                        {m.email === currentUser.email && <span className="badge badge-neutral">Bạn</span>}
                      </div>
                    </td>
                    <td>
                      {m.role === "Leader" && <span className="badge badge-primary"><Shield size={12} style={{ marginRight: 4 }} /> Trưởng đội</span>}
                      {m.role === "Member" && m.status === "pending_approval" && <span className="badge badge-warning">Chờ duyệt</span>}
                      {m.role === "Member" && m.status !== "pending_approval" && <span className="badge badge-neutral">Thành viên</span>}
                      {m.role.includes("Mentor") && <span className="badge badge-success"><Star size={12} style={{ marginRight: 4 }} /> Cố vấn</span>}
                    </td>
                    <td><span style={{ color: "var(--color-text-2)" }}>{m.email}</span></td>
                    {isLeader && (
                      <td style={{ textAlign: "right" }}>
                        {m.email !== currentUser.email && m.status === "pending_approval" && (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button className="btn btn-primary btn-sm" onClick={() => handleApproveMember(m.email)}>
                              Duyệt
                            </button>
                            <button className="btn btn-ghost danger btn-sm" onClick={() => handleRejectMember(m.email)}>
                              Từ chối
                            </button>
                          </div>
                        )}
                        {m.email !== currentUser.email && m.status !== "pending_approval" && (
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            {!m.role.includes("Mentor") && (
                              <button className="btn btn-secondary btn-sm" onClick={() => handlePromote(m.email, m.fullName)}>
                                Thăng cấp lên Trưởng đội
                              </button>
                            )}
                            <button className="btn btn-ghost danger btn-sm" onClick={() => handleKick(m.email, m.fullName)}>
                              Loại
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
              <div key={m.userId} style={{ padding: "1rem", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.fullName} <span className="badge badge-primary">{m.matchPercentage}% Phù hợp</span></h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Vai trò: {m.role} · Kỹ năng: {m.skills.join(", ")}</div>
                  <div style={{ fontSize: "0.75rem", color: "#10b981", marginTop: "4px" }}>Lý do: {m.matchReasons?.join(", ")}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.email)}><UserPlus size={14} /> Gửi lời mời</button>
              </div>
            ))}
            {matches.length === 0 && <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem" }}>Hãy thử tìm kiếm một kỹ năng để xem gợi ý.</div>}
          </div>
        </div>
      )}

      {tab === "mentors" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}><Star size={18} style={{ display:'inline', marginRight: 8, color: '#6366f1' }}/> Tự động tìm Cố vấn</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", marginBottom: "1.5rem" }}>AI của chúng tôi sẽ gợi ý các cố vấn phù hợp nhất dựa trên hạng mục dự án của đội thi ({myTeam.track || "General"}).</p>
          
          {mentors.length === 0 ? (
            <button className="btn btn-primary" onClick={handleAutoFindMentors}><Zap size={16}/> Tự động tìm Cố vấn</button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {mentors.map(m => (
                <div key={m.userId} style={{ padding: "1rem", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h4 style={{ margin: "0 0 0.25rem 0" }}>{m.fullName} <span className="badge badge-success">{m.match} Phù hợp</span></h4>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>Chuyên môn: {m.expertise}</div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => handleInvite(m.email, true)}><UserCheck size={14} /> Yêu cầu Cố vấn</button>
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
      
    </div>
  );
}
