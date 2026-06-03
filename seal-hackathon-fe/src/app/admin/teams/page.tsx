"use client";
import { useState, useEffect } from "react";
import { Users, Search, CheckCircle, XCircle, Clock, Shield, Filter, Plus } from "lucide-react";
import { App } from "antd";
import { databaseService } from "@/services/databaseService";
import { Team } from "@/types/models";

export default function AdminTeamsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadTeams = () => {
    setLoading(true);
    setTimeout(() => {
      const data = databaseService.getTeams();
      setTeams(data);
      setLoading(false);
    }, 400);
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleUpdateStatus = (id: string, newStatus: string) => {
    message.loading({ content: "Đang cập nhật...", key: "updatestatus" });
    setTimeout(() => {
      const db = databaseService.getDB();
      const team = db.teams.find(t => t.id === id);
      if (team) {
        team.status = newStatus;
        databaseService.saveDB(db);
        setTeams([...db.teams]);
        message.success({ content: `Đã đổi trạng thái nhóm thành ${newStatus}!`, key: "updatestatus" });
      }
    }, 600);
  };

  const filteredTeams = teams.filter(t => {
    let matchFilter = filter === "All";
    if (filter === "Pending") matchFilter = t.status === "Pending";
    else if (filter === "Submitted") matchFilter = t.status === "Submitted";
    else if (filter === "Late") matchFilter = t.status === "Late" || t.status === "Rejected";

    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.track.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="page-header"><h1 className="page-title">Đang tải danh sách nhóm...</h1></div>;

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Quản Lý Nhóm Dự Thi</h1>
          <p className="page-subtitle">Duyệt và theo dõi tất cả các nhóm tham gia hệ thống</p>
        </div>
      </div>

      <div className="glass-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem", flexShrink: 0 }}>
        {[
          { label: "Tổng Số Nhóm", val: teams.length, color: "var(--color-primary)", filterValue: "All" },
          { label: "Chờ Duyệt (Pending)", val: teams.filter(t => t.status === "Pending").length, color: "#f59e0b", filterValue: "Pending" },
          { label: "Đã Duyệt (Submitted)", val: teams.filter(t => t.status === "Submitted").length, color: "#10b981", filterValue: "Submitted" },
          { label: "Nộp Trễ / Vấn Đề", val: teams.filter(t => t.status === "Late" || t.status === "Rejected").length, color: "#ef4444", filterValue: "Late" },
        ].map(s => (
          <div key={s.label} className="glass-card" 
               style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1.25rem", cursor: "pointer", border: filter === s.filterValue ? `1px solid ${s.color}` : undefined }} 
               onClick={() => setFilter(s.filterValue)}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color, lineHeight: 1 }}>{s.val}</div>
            <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", flexShrink: 0 }}>
        <div className="input-with-icon" style={{ flex: 1 }}>
          <input 
            className="form-input" 
            placeholder="Tìm kiếm theo tên nhóm, track..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: "2.5rem" }} 
          />
          <Search size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--color-text-3)" }} />
          <select className="form-input" style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">Tất Cả Trạng Thái</option>
            <option value="Submitted">Đã Duyệt (Submitted)</option>
            <option value="Pending">Chờ Duyệt (Pending)</option>
            <option value="Late">Nộp Trễ (Late)</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border-1)" }}>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Nhóm</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Track</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Thành Viên</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Trạng Thái</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", textAlign: "right" }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team, idx) => (
              <tr key={team.id} style={{ borderBottom: idx === filteredTeams.length - 1 ? "none" : "1px solid var(--color-border-1)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text-1)", fontSize: "1rem" }}>{team.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem", fontFamily: "monospace" }}>{team.id}</div>
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <span className="glass-badge">{team.track}</span>
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Users size={16} style={{ color: "var(--color-text-3)" }} />
                    <span>{team.membersCount || (team.members ? team.members.length : 0)}/5</span>
                  </div>
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <span className={`glass-badge ${team.status === "Submitted" ? "success" : team.status === "Pending" ? "warning" : "danger"}`}>
                    {team.status === "Submitted" ? "Đã Duyệt" : team.status}
                  </span>
                </td>
                <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    {team.status !== "Submitted" && (
                      <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", padding: "0.4rem 0.8rem", border: "1px solid rgba(16,185,129,0.2)" }} onClick={() => handleUpdateStatus(team.id, "Submitted")}>
                        <CheckCircle size={14} style={{ marginRight: 4 }} /> Duyệt
                      </button>
                    )}
                    {team.status !== "Pending" && (
                      <button className="btn btn-sm" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", padding: "0.4rem 0.8rem", border: "1px solid rgba(245,158,11,0.2)" }} onClick={() => handleUpdateStatus(team.id, "Pending")}>
                        <Clock size={14} style={{ marginRight: 4 }} /> Hủy Duyệt
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTeams.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: "3rem 1.5rem", textAlign: "center", color: "var(--color-text-3)" }}>
                  <Shield size={48} style={{ margin: "0 auto 1rem", opacity: 0.3 }} />
                  <div>Không tìm thấy nhóm nào khớp với điều kiện lọc.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
