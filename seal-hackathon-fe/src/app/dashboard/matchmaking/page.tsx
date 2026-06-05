"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, UserPlus, MessageSquare, GraduationCap, Zap, Send, Inbox, Clock } from "lucide-react";
import { App, Spin, Empty, Button, Tag } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

interface TeamMemberData {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  role: string;
}

interface TeamData {
  teamId: string;
  teamName: string;
  status: string;
  leaderId: string;
  category: {
    categoryId: string;
    categoryName: string;
  };
  members: TeamMemberData[];
}

interface FreeAgentOrSuggestion {
  id: string;
  name: string;
  email: string;
  studentCode?: string | null;
  schoolName?: string | null;
  studentType?: string;
  role: string;
  skills: string[];
  xp: number;
  matchPercentage?: number;
  matchReasons?: string[];
}

interface InvitationResponse {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviterUserName: string;
  inviteeUserId: string;
  inviteeUserName: string;
  inviteeUserEmail: string;
  status: string;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}

export default function MatchmakingPage() {
  const { message } = App.useApp();
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"suggestions" | "sent" | "received">("suggestions");

  // Tab 1: Suggestions / Free Agents
  const [suggestions, setSuggestions] = useState<FreeAgentOrSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  // Tab 2: Sent Invitations
  const [sentInvites, setSentInvites] = useState<InvitationResponse[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);

  // Tab 3: Received Invitations
  const [receivedInvites, setReceivedInvites] = useState<InvitationResponse[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);

      try {
        const teamData = await apiRequest<TeamData>("/teams/my-team");
        setMyTeam(teamData);
      } catch {
        setMyTeam(null);
      }
    } catch {
      message.error("Không thể tải thông tin đăng nhập.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      void loadInitialData();
    };
    void trigger();
  }, [loadInitialData]);

  const loadSuggestionsOrAgents = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      if (searchQuery || skillFilter) {
        const data = await apiRequest<FreeAgentOrSuggestion[]>(
          `/users/free-agents?search=${encodeURIComponent(searchQuery)}&role=${encodeURIComponent(skillFilter)}`
        );
        setSuggestions(data);
      } else {
        const data = await apiRequest<FreeAgentOrSuggestion[]>("/matchmaking/suggestions");
        setSuggestions(data);
      }
    } catch {
      message.error("Không thể tải danh sách ứng viên.");
    } finally {
      setLoadingSuggestions(false);
    }
  }, [searchQuery, skillFilter, message]);

  const loadSentInvites = useCallback(async () => {
    if (!myTeam) return;
    setLoadingSent(true);
    try {
      const data = await apiRequest<InvitationResponse[]>("/teams/invitations/sent");
      setSentInvites(data);
    } catch {
      message.error("Không thể tải lời mời đã gửi.");
    } finally {
      setLoadingSent(false);
    }
  }, [myTeam, message]);

  const loadReceivedInvites = useCallback(async () => {
    setLoadingReceived(true);
    try {
      const data = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
      setReceivedInvites(data);
    } catch {
      message.error("Không thể tải lời mời đã nhận.");
    } finally {
      setLoadingReceived(false);
    }
  }, [message]);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      if (activeTab === "suggestions") {
        void loadSuggestionsOrAgents();
      } else if (activeTab === "sent") {
        void loadSentInvites();
      } else if (activeTab === "received") {
        void loadReceivedInvites();
      }
    };
    void trigger();
  }, [activeTab, loadSuggestionsOrAgents, loadSentInvites, loadReceivedInvites]);

  const handleInvite = async (targetUser: FreeAgentOrSuggestion) => {
    if (!myTeam) {
      message.error("Bạn chưa có nhóm. Vui lòng tạo nhóm trước khi mời thành viên.");
      return;
    }
    if (myTeam.leaderId !== currentUser?.id) {
      message.error("Chỉ Trưởng nhóm mới có quyền gửi lời mời tham gia.");
      return;
    }
    if (myTeam.status !== "Pending") {
      message.error("Nhóm đã được phê duyệt, không thể mời thêm thành viên.");
      return;
    }
    if (myTeam.members.length >= 5) {
      message.warning("Nhóm đã đạt giới hạn tối đa 5 thành viên.");
      return;
    }

    try {
      await apiRequest("/teams/invitations", {
        method: "POST",
        body: JSON.stringify({
          inviteeUserId: targetUser.id,
          message: `Chào ${targetUser.name}, nhóm mình rất muốn mời bạn tham gia cùng thực hiện dự án!`
        })
      });
      message.success(`Đã gửi lời mời thành công đến ${targetUser.name}!`);
      void loadSuggestionsOrAgents();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Gửi lời mời thất bại.");
    }
  };

  const handleCancelInvite = async (id: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/cancel`, { method: "POST" });
      message.success("Đã hủy lời mời.");
      void loadSentInvites();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Hủy lời mời thất bại.");
    }
  };

  const handleAcceptInvite = async (id: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/accept`, { method: "POST" });
      message.success("Đã đồng ý gia nhập nhóm thành công!");
      try {
        const teamData = await apiRequest<TeamData>("/teams/my-team");
        setMyTeam(teamData);
      } catch {
        setMyTeam(null);
      }
      void loadReceivedInvites();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Gia nhập nhóm thất bại.");
    }
  };

  const handleRejectInvite = async (id: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/reject`, { method: "POST" });
      message.success("Đã từ chối lời mời.");
      void loadReceivedInvites();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Từ chối lời mời thất bại.");
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Spin size="large" />
        <div className="empty-title">Đang tải thông tin...</div>
      </div>
    );
  }

  const getStatusTag = (status: string) => {
    switch (status) {
      case "Pending":
        return <Tag color="warning">Đang chờ</Tag>;
      case "Accepted":
        return <Tag color="success">Đã đồng ý</Tag>;
      case "Rejected":
        return <Tag color="error">Từ chối</Tag>;
      case "Cancelled":
        return <Tag color="default">Đã hủy</Tag>;
      default:
        return <Tag color="default">{status}</Tag>;
    }
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Teammate Matchmaking</h1>
          <p className="page-subtitle">
            Tìm kiếm đồng đội và quản lý lời mời tham gia dự án thực tế.
          </p>
        </div>
      </div>

      {myTeam ? (
        <div className="glass-card" style={{ marginBottom: "2rem", padding: "1rem 1.5rem", borderLeft: "4px solid var(--color-primary)" }}>
          <div style={{ fontWeight: 600, fontSize: "1.05rem" }}>
            Nhóm của bạn: <span style={{ color: "var(--color-primary-2)" }}>{myTeam.teamName}</span>
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
            Thành viên ({myTeam.members.length}/5) · Vai trò của bạn: {myTeam.leaderId === currentUser?.id ? <b>Trưởng nhóm (Leader)</b> : "Thành viên"}
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ marginBottom: "2rem", padding: "1rem 1.5rem", borderLeft: "4px solid var(--color-warning)" }}>
          <div style={{ fontWeight: 600, fontSize: "1.05rem", color: "var(--color-warning)" }}>
            Bạn chưa tham gia nhóm nào
          </div>
          <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "0.25rem" }}>
            Hãy ứng tuyển thông qua lời mời nhận được từ các nhóm khác hoặc tự tạo nhóm tại trang Quản lý Nhóm.
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        <button className={`tab-btn ${activeTab === "suggestions" ? "active" : ""}`} onClick={() => setActiveTab("suggestions")}>
          <Zap size={14} style={{ marginRight: 6 }} /> Gợi ý / Tìm kiếm
        </button>
        <button 
          className={`tab-btn ${activeTab === "sent" ? "active" : ""}`} 
          onClick={() => setActiveTab("sent")}
          disabled={!myTeam}
        >
          <Send size={14} style={{ marginRight: 6 }} /> Lời mời đã gửi {!myTeam && " (Yêu cầu nhóm)"}
        </button>
        <button className={`tab-btn ${activeTab === "received" ? "active" : ""}`} onClick={() => setActiveTab("received")}>
          <Inbox size={14} style={{ marginRight: 6 }} /> Lời mời đã nhận
        </button>
      </div>

      {/* SUGGESTIONS TAB */}
      {activeTab === "suggestions" && (
        <>
          <div className="glass-card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div className="search-bar" style={{ flex: "1 1 300px", maxWidth: "500px" }}>
                <Search size={16} style={{ color: "var(--color-text-3)" }} />
                <input 
                  className="search-input" 
                  placeholder="Tìm kiếm kỹ năng hoặc tên (VD: React, Designer)..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: "1 1 200px" }}>
                <Filter size={16} style={{ color: "var(--color-text-3)" }} />
                <select 
                  className="form-input" 
                  style={{ width: "100%", cursor: "pointer" }}
                  value={skillFilter}
                  onChange={e => setSkillFilter(e.target.value)}
                >
                  <option value="">Tất cả vai trò</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="AI Engineer">AI Engineer</option>
                  <option value="Web3 Developer">Web3 Developer</option>
                  <option value="Fullstack Developer">Fullstack Developer</option>
                </select>
              </div>
            </div>
          </div>

          {loadingSuggestions ? (
            <div className="empty-state">
              <Spin />
              <div className="empty-title" style={{ marginTop: 10 }}>Đang tải danh sách ứng viên...</div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Empty description="Không tìm thấy ứng viên tự do nào phù hợp." />
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
              {suggestions.map((user) => (
                <div key={user.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: "1.2rem", flexShrink: 0, background: 'var(--color-surface-2)' }}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>{user.name}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-text-3)", fontSize: "0.8rem" }}>
                          <GraduationCap size={12} /> XP: {user.xp}
                        </div>
                      </div>
                    </div>
                    {user.matchPercentage !== undefined && (
                      <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Zap size={12} /> {user.matchPercentage}% Match
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1, marginTop: '0.5rem' }}>
                    <div style={{ fontSize: "0.9rem", color: "var(--color-text-1)", marginBottom: "0.5rem", fontWeight: 600 }}>
                      Vai trò: <span style={{ fontWeight: 400, color: 'var(--color-text-2)' }}>{user.role}</span>
                    </div>
                    
                    {user.matchReasons && user.matchReasons.length > 0 && (
                      <div style={{ fontSize: "0.8rem", color: "#f59e0b", marginBottom: "1rem" }}>
                        Lý do đề xuất: {user.matchReasons.join(", ")}
                      </div>
                    )}
                    
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "auto" }}>
                      {(user.skills || []).map((skill: string, sIdx: number) => (
                        <span key={sIdx} style={{ fontSize: "0.75rem", padding: "0.2rem 0.6rem", background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", borderRadius: "99px", border: "1px solid rgba(99,102,241,0.2)" }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border)" }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ flex: 1, padding: "0.6rem" }} 
                      onClick={() => handleInvite(user)}
                      disabled={!myTeam || myTeam.leaderId !== currentUser?.id}
                    >
                      <UserPlus size={16} /> Mời vào nhóm
                    </button>
                    <button className="btn btn-secondary" style={{ padding: "0.6rem" }} onClick={() => message.info(`Đã bắt đầu chat với ${user.name}`)}>
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* SENT INVITATIONS TAB */}
      {activeTab === "sent" && myTeam && (
        <>
          {loadingSent ? (
            <div className="empty-state">
              <Spin />
              <div className="empty-title" style={{ marginTop: 10 }}>Đang tải lời mời đã gửi...</div>
            </div>
          ) : sentInvites.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Empty description="Nhóm của bạn chưa gửi lời mời nào." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {sentInvites.map((invite) => (
                <div key={invite.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>{invite.inviteeUserName}</span>
                      <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>({invite.inviteeUserEmail})</span>
                      {getStatusTag(invite.status)}
                    </div>
                    {invite.message && (
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginTop: "0.5rem", fontStyle: "italic" }}>
                        &ldquo;{invite.message}&rdquo;
                      </div>
                    )}
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> Gửi lúc: {new Date(invite.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    {invite.status === "Pending" && myTeam.leaderId === currentUser?.id && (
                      <Button danger onClick={() => handleCancelInvite(invite.id)}>Hủy lời mời</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* RECEIVED INVITATIONS TAB */}
      {activeTab === "received" && (
        <>
          {loadingReceived ? (
            <div className="empty-state">
              <Spin />
              <div className="empty-title" style={{ marginTop: 10 }}>Đang tải lời mời nhận được...</div>
            </div>
          ) : receivedInvites.length === 0 ? (
            <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <Empty description="Bạn chưa nhận được lời mời nào." />
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {receivedInvites.map((invite) => (
                <div key={invite.id} className="glass-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.25rem 1.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem" }}>Nhóm: {invite.teamName}</span>
                      <span style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>Người mời: {invite.inviterUserName}</span>
                      {getStatusTag(invite.status)}
                    </div>
                    {invite.message && (
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginTop: "0.5rem", fontStyle: "italic" }}>
                        &ldquo;{invite.message}&rdquo;
                      </div>
                    )}
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.5rem", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> Nhận lúc: {new Date(invite.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    {invite.status === "Pending" && (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Button type="primary" onClick={() => handleAcceptInvite(invite.id)}>Đồng ý</Button>
                        <Button danger onClick={() => handleRejectInvite(invite.id)}>Từ chối</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
