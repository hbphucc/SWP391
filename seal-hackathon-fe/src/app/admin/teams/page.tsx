"use client";
import { useState, useEffect } from "react";
import { Users, Search, CheckCircle, XCircle, Clock, Shield, Filter, Plus } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

export default function AdminTeamsPage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>("/admin/teams");
      setTeams(data);
    } catch (err: any) {
      message.error("Tải danh sách đội thi thất bại: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleUpdateStatus = async (id: string, action: "approve" | "reject") => {
    message.loading({ content: "Đang cập nhật...", key: "updatestatus" });
    try {
      await apiRequest(`/admin/teams/${id}/${action}`, { method: "PUT" });
      message.success({ content: `Đã ${action === "approve" ? "duyệt" : "loại"} đội thi!`, key: "updatestatus" });
      loadTeams();
    } catch (err: any) {
      message.error({ content: err.message || "Cập nhật trạng thái thất bại", key: "updatestatus" });
    }
  };

  const filteredTeams = teams.filter(t => {
    let matchFilter = filter === "All";
    if (filter === "Pending") matchFilter = t.status === "Pending";
    else if (filter === "Approved") matchFilter = t.status === "Approved";
    else if (filter === "Eliminated") matchFilter = t.status === "Eliminated";

    const matchSearch = (t.teamName || "").toLowerCase().includes(search.toLowerCase()) || 
                        (t.category?.categoryName || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return <div className="page-header"><h1 className="page-title">Đang tải danh sách đội thi...</h1></div>;

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Quản Lý Đội Thi</h1>
          <p className="page-subtitle">Duyệt và theo dõi tất cả các đội thi tham gia hệ thống</p>
        </div>
      </div>

      <div className="glass-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem", flexShrink: 0 }}>
        {[
          { label: "Tổng Số Đội Thi", val: teams.length, color: "var(--color-primary)", filterValue: "All" },
          { label: "Chờ Duyệt", val: teams.filter(t => t.status === "Pending").length, color: "#f59e0b", filterValue: "Pending" },
          { label: "Đã Duyệt", val: teams.filter(t => t.status === "Approved").length, color: "#10b981", filterValue: "Approved" },
          { label: "Bị Loại", val: teams.filter(t => t.status === "Eliminated").length, color: "#ef4444", filterValue: "Eliminated" },
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
            placeholder="Tìm kiếm theo tên đội thi, hạng mục..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            style={{ paddingLeft: "2.5rem" }} 
          />
          <Search size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Filter size={16} style={{ color: "var(--color-text-3)" }} />
          <select className="form-input" style={{ width: "auto" }} value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="All">Tất cả trạng thái</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Pending">Chờ duyệt</option>
            <option value="Eliminated">Bị loại</option>
          </select>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0, overflowY: "auto", flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid var(--color-border-1)" }}>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Đội Thi</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Hạng Mục</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Thành Viên</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px" }}>Trạng Thái</th>
              <th style={{ padding: "1.25rem 1.5rem", fontWeight: 600, color: "var(--color-text-3)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", textAlign: "right" }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team, idx) => (
              <tr key={team.teamId} style={{ borderBottom: idx === filteredTeams.length - 1 ? "none" : "1px solid var(--color-border-1)", transition: "background 0.2s" }} onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"} onMouseOut={e => e.currentTarget.style.background = "transparent"}>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ fontWeight: 600, color: "var(--color-text-1)", fontSize: "1rem" }}>{team.teamName}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)", marginTop: "0.25rem", fontFamily: "monospace" }}>{team.teamId.split("-")[0]}...</div>
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <span className="glass-badge">{team.category?.categoryName || "Chưa có"}</span>
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Users size={16} style={{ color: "var(--color-text-3)" }} />
                    <span>{team.members?.length || 0}/5</span>
                  </div>
                </td>
                <td style={{ padding: "1.25rem 1.5rem" }}>
                  <span className={`glass-badge ${team.status === "Approved" ? "success" : team.status === "Pending" ? "warning" : "danger"}`}>
                    {team.status === "Approved" ? "Đã duyệt" : team.status === "Pending" ? "Chờ duyệt" : "Bị loại"}
                  </span>
                </td>
                <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                    {team.status === "Pending" && (
                      <>
                        <button className="btn btn-sm" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", padding: "0.4rem 0.8rem", border: "1px solid rgba(16,185,129,0.2)" }} onClick={() => handleUpdateStatus(team.teamId, "approve")}>
                          <CheckCircle size={14} style={{ marginRight: 4 }} /> Duyệt
                        </button>
                        <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "0.4rem 0.8rem", border: "1px solid rgba(239,68,68,0.2)" }} onClick={() => handleUpdateStatus(team.teamId, "reject")}>
                          <XCircle size={14} style={{ marginRight: 4 }} /> Từ chối
                        </button>
                      </>
                    )}
                    {team.status === "Approved" && (
                      <button className="btn btn-sm" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "0.4rem 0.8rem", border: "1px solid rgba(239,68,68,0.2)" }} onClick={() => handleUpdateStatus(team.teamId, "reject")}>
                        <XCircle size={14} style={{ marginRight: 4 }} /> Hủy duyệt / Loại
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
                  <div>Không tìm thấy đội thi nào khớp với điều kiện lọc.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
