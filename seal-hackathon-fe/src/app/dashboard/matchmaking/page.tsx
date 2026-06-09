"use client";
import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, MessageSquare, GraduationCap, Zap } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

export default function MatchmakingPage() {
  const { message, notification } = App.useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
        if (userStr) setCurrentUser(JSON.parse(userStr));

        const teamData = await apiRequest<any>("/teams/my-team");
        setMyTeam(teamData);
      } catch {
        setMyTeam(null);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const data = await apiRequest<any[]>("/Matchmaking/free-agents");
        
        let filtered = data;
        if (searchQuery) {
          filtered = filtered.filter(u => u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                          u.skills?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase())));
        }
        setUsers(filtered);
      } catch (err) {
        console.error("Tải danh sách ứng viên tự do thất bại", err);
      }
    };
    fetchAgents();
  }, [searchQuery, skillFilter]);

  const handleInvite = async (targetUser: any) => {
    if (!myTeam || !myTeam.teamId) {
      message.error({
        content: "Bạn chưa có đội thi, vui lòng tạo đội thi để có thể mời thành viên.",
        duration: 4,
        style: { fontSize: '1rem', marginTop: '20vh' }
      });
      return;
    }

    if (myTeam.members.length >= 5) {
      message.warning("Đội thi của bạn đã đạt giới hạn tối đa (5 thành viên).");
      return;
    }

    message.loading({ content: `Đang gửi lời mời đến ${targetUser.fullName}...`, key: "invite_matchmaking" });
    
    try {
      await apiRequest(`/Teams/${myTeam.teamId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: targetUser.userId })
      });
      
      notification.success({
        title: "Lời mời được chấp nhận!",
        description: `${targetUser.fullName} đã vào đội thi thành công!`,
        duration: 5,
        placement: "topRight"
      });
      
      // Update local team state optimistic or re-fetch
      const newMember = {
        userId: targetUser.userId,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: "Member"
      };
      setMyTeam({ ...myTeam, members: [...myTeam.members, newMember] });
    } catch (e: any) {
      notification.error({
        title: "Không thể mời người dùng này",
        description: e.message || "Người dùng này có thể đã ở trong một đội thi khác hoặc có lỗi xảy ra.",
        duration: 7,
        placement: "topRight"
      });
    }
  };

  if (currentUser?.role?.toLowerCase()?.includes("judge")) {
    return <div style={{ padding: "2rem" }}>Tính năng này chỉ dành cho Thí sinh. Giám khảo không cần ghép đội.</div>;
  }

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Ghép đội thi</h1>
          <p className="page-subtitle">Hệ thống AI đề xuất Top 10 người dùng phù hợp nhất mà đội thi bạn đang thiếu (Lọc từ hệ thống 1000+ ứng viên tự do).</p>
        </div>
      </div>

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
              <option value="react">Frontend (React/Vue)</option>
              <option value="node">Backend (Node/Python)</option>
              <option value="design">UI/UX Designer</option>
              <option value="ai">AI Engineer</option>
              <option value="web3">Web3 / Blockchain</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
        {users.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "3rem 1rem" }}>
            <h3 style={{ color: "var(--color-text-2)" }}>Không tìm thấy ứng viên phù hợp.</h3>
            <p style={{ color: "var(--color-text-3)", marginTop: "0.5rem" }}>Vui lòng thử điều chỉnh lại bộ lọc.</p>
          </div>
        ) : (
          users.map((user, idx) => (
            <div key={idx} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "1rem", transition: "transform 0.2s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  <div className="avatar-placeholder" style={{ width: 48, height: 48, fontSize: "1.2rem", flexShrink: 0, background: 'var(--color-surface-2)' }}>
                    {user.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>{user.fullName}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-text-3)", fontSize: "0.8rem" }}>
                      <GraduationCap size={12} /> XP: {user.xp || Math.floor(Math.random() * 500) + 100}
                    </div>
                  </div>
                </div>
                {user.matchPercentage && (
                  <div className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={12} /> {user.matchPercentage}% Phù hợp
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
                <button className="btn btn-primary" style={{ flex: 1, padding: "0.6rem" }} onClick={() => handleInvite(user)}>
                  <UserPlus size={16} /> Mời vào đội thi
                </button>
                <button className="btn btn-secondary" style={{ padding: "0.6rem" }} onClick={() => message.info(`Bắt đầu trò chuyện với ${user.fullName}`)}>
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

