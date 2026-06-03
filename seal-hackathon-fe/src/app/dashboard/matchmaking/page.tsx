"use client";
import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, MessageSquare, GraduationCap, Zap } from "lucide-react";
import { App } from "antd";
import { databaseService } from "@/services/databaseService";

export default function MatchmakingPage() {
  const { message, notification } = App.useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myTeam, setMyTeam] = useState<any>(null);

  useEffect(() => {
    // 1. Get User and Team from LocalStorage
    const userStr = localStorage.getItem("currentUser");
    let user = null;
    if (userStr) {
      user = JSON.parse(userStr);
      setCurrentUser(user);
    }
    
    let team = null;
    if (user && user.email) {
      const teamStr = localStorage.getItem(`myTeam_${user.email}`);
      if (teamStr) {
        team = JSON.parse(teamStr);
        setMyTeam(team);
      }
    }

    // 2. Lấy 10 người phù hợp nhất từ DB 1000 người
    // Nếu có nhóm thì lấy các role hiện tại để tìm người thiếu
    const teamRoles = team ? team.members.map((m: any) => m.role) : [];
    const bestMatches = databaseService.getTop10BestMatches(teamRoles, searchQuery || skillFilter);
    
    // Nếu search có kết quả thì thuật toán trả về Top 3, nếu không thì Top 10
    setUsers(bestMatches);
  }, [searchQuery, skillFilter]);

  const handleInvite = (targetUser: any) => {
    if (!myTeam) {
      message.error({
        content: "Bạn chưa có nhóm, vui lòng tạo nhóm để có thể mời thành viên.",
        duration: 4,
        style: { fontSize: '1rem', marginTop: '20vh' }
      });
      return;
    }

    // Check if team is full
    if (myTeam.members.length >= 5) {
      message.warning("Nhóm của bạn đã đạt giới hạn tối đa (5 thành viên).");
      return;
    }

    message.loading({ content: `Đang gửi lời mời đến ${targetUser.name}...`, key: "invite_matchmaking" });
    
    setTimeout(() => {
      // 70% đồng ý
      const isAccepted = Math.random() > 0.3; 
      const isLeader = myTeam.members.find((m:any) => m.email === currentUser.email)?.role === "Leader";
      
      if (isAccepted) {
        if (isLeader) {
          notification.success({
            title: "Lời mời được chấp nhận!",
            description: `${targetUser.name} đã vô nhóm thành công!`,
            duration: 5,
            placement: "topRight"
          });
        } else {
          notification.info({
            title: "Chờ phê duyệt",
            description: `${targetUser.name} đã đồng ý tham gia! Đang chờ Trưởng nhóm phê duyệt.`,
            duration: 6,
            placement: "topRight"
          });
        }
        
        // Thêm vào team
        const newMember = { 
          id: targetUser.id, 
          name: targetUser.name, 
          email: targetUser.email, 
          role: targetUser.role || "Member", 
          status: isLeader ? "active" : "pending_approval",
          skills: targetUser.skills 
        };
        const updatedTeam = { ...myTeam, members: [...myTeam.members, newMember] };
        localStorage.setItem(`myTeam_${currentUser.email}`, JSON.stringify(updatedTeam));
        setMyTeam(updatedTeam);
      } else {
        const reasons = [
          "Tôi đã có nhóm khác rồi.", 
          "Tôi đang bận không thể tham gia hackathon này.", 
          "Định hướng của nhóm chưa phù hợp với tôi lắm."
        ];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];
        
        notification.error({
          title: "Lời mời bị từ chối",
          description: `${targetUser.name} đã từ chối lời mời. (Lý do: ${reason})`,
          duration: 7,
          placement: "topRight"
        });
      }
    }, 2500);
  };

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div className="page-header" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="page-title">Teammate Matchmaking</h1>
          <p className="page-subtitle">Hệ thống AI đề xuất Top 10 người dùng phù hợp nhất mà nhóm bạn đang thiếu (Lọc từ hệ thống 1000+ free agents).</p>
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
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 style={{ margin: "0 0 0.2rem 0", fontSize: "1.1rem" }}>{user.name}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--color-text-3)", fontSize: "0.8rem" }}>
                      <GraduationCap size={12} /> XP: {user.xp}
                    </div>
                  </div>
                </div>
                {user.matchPercentage && (
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
                <button className="btn btn-primary" style={{ flex: 1, padding: "0.6rem" }} onClick={() => handleInvite(user)}>
                  <UserPlus size={16} /> Mời vào nhóm
                </button>
                <button className="btn btn-secondary" style={{ padding: "0.6rem" }} onClick={() => message.info(`Chat initiated with ${user.name}`)}>
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
