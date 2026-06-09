"use client";
import { useEffect,  useState } from "react";
import { Trophy, Medal, Award, Download, Filter, TrendingUp, Crown } from "lucide-react";

import { apiRequest } from "@/lib/api";

const RANK_ICON: Record<number, React.ReactNode> = {
  1: <Trophy size={16} style={{ color: "#f59e0b" }} />,
  2: <Medal  size={16} style={{ color: "#94a3b8" }} />,
  3: <Award  size={16} style={{ color: "#b45309" }} />,
};

const STATUS_BADGE: Record<string, string> = {
  finalist:   "badge-warning",
  advancing:  "badge-success",
  eliminated: "badge-danger",
};

export default function RankingsPage() {
  const [trackFilter, setTrackFilter] = useState("All");
  const [rankings, setRankings] = useState<any[]>([]);
  const [tracks, setTracks] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const events = await apiRequest<any[]>("/Events");
        if (events.length > 0) {
          const eventDetails = await apiRequest<any>(`/Events/${events[0].eventId}`);
          if (eventDetails.rounds && eventDetails.rounds.length > 0) {
            const firstRound = eventDetails.rounds[0].roundId;
            const data = await apiRequest<any[]>(`/ranking/round/${firstRound}`);
            
            // Map the API data
            const mapped = data.map((d: any) => ({
              rank: d.rank,
              team: d.teamName,
              track: d.categoryName,
              score: Math.round(d.totalScore * 10) / 10,
              judges: d.judgesCount || 0,
              status: d.rank <= 3 ? "advancing" : "eliminated"
            }));
            
            setRankings(mapped);

            const uniqueTracks = Array.from(new Set(mapped.map(m => m.track)));
            setTracks(["All", ...(uniqueTracks as string[])]);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRankings();
  }, []);

  const filtered = rankings.filter(r => trackFilter === "All" ? true : r.track === trackFilter);

  const exportRankingsCSV = () => {
    const header = "Rank,Team,Track,Score,Judges,Status\n";
    const rows = filtered.map(r => `${r.rank},${r.team},${r.track},${r.score},${r.judges},${r.status}`).join("\n");
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leaderboard_${trackFilter.replace(/\s+/g, "_").toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Bảng xếp hạng</h1>
          <p className="page-subtitle">SEAL Spring 2026 · Vòng loại</p>
        </div>
        <button className="btn btn-secondary" onClick={exportRankingsCSV}><Download size={15} /> Xuất CSV</button>
      </div>

      {/* Top 3 Podium */}
      {rankings.length >= 3 && (
        <div style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "flex-end", justifyContent: "center" }}>
          {/* 2nd */}
          <div className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: "3px solid #94a3b8", paddingTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Crown size={32} style={{ color: "#94a3b8" }} /></div>
            <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>{rankings[1].team}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{rankings[1].track}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#94a3b8", marginTop: "0.5rem" }}>
              {rankings[1].score}
            </div>
          </div>
          {/* 1st */}
          <div className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: "3px solid #f59e0b", paddingTop: "2rem", transform: "translateY(-12px)", boxShadow: "0 0 30px rgba(245,158,11,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Crown size={42} style={{ color: "#f59e0b", filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }} /></div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", marginTop: "0.5rem", background: "linear-gradient(135deg,#f59e0b,#fbbf24)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {rankings[0].team}
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{rankings[0].track}</div>
            <div style={{ fontSize: "2.2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#f59e0b", marginTop: "0.5rem" }}>
              {rankings[0].score}
            </div>
          </div>
          {/* 3rd */}
          <div className="glass-card" style={{ flex: 1, textAlign: "center", borderTop: "3px solid #b45309", paddingTop: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Crown size={32} style={{ color: "#b45309" }} /></div>
            <div style={{ fontWeight: 700, marginTop: "0.5rem" }}>{rankings[2].team}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{rankings[2].track}</div>
            <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: "#b45309", marginTop: "0.5rem" }}>
              {rankings[2].score}
            </div>
          </div>
        </div>
      )}

      {/* Track filter */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {tracks.map(t => (
          <button key={t} className={`tab-btn ${trackFilter===t?"active":""}`} onClick={() => setTrackFilter(t)}>{t === "All" ? "Tất cả" : t}</button>
        ))}
      </div>

      {/* Full Rankings Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead><tr>
            <th>Hạng</th><th>Đội thi</th><th>Hạng mục</th><th>Điểm</th><th>Giám khảo</th><th>Mức điểm</th><th>Trạng thái</th>
          </tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.rank}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    {RANK_ICON[r.rank] || <span style={{ color: "var(--color-text-3)", fontWeight: 700 }}>#{r.rank}</span>}
                    {r.rank <= 3 && <span style={{ fontWeight: 800, color: r.rank===1?"#f59e0b":r.rank===2?"#94a3b8":"#b45309" }}>#{r.rank}</span>}
                  </div>
                </td>
                <td className="table-cell-primary">{r.team}</td>
                <td><span className="badge badge-neutral">{r.track}</span></td>
                <td>
                  <span style={{ fontWeight: 800, fontSize: "1rem", fontFamily: "var(--font-display)", color: r.score >= 90 ? "#10b981" : r.score >= 80 ? "#f59e0b" : "#f43f5e" }}>
                    {r.score}
                  </span>
                </td>
                <td>{r.judges}</td>
                <td style={{ minWidth: 120 }}>
                  <div className="progress">
                    <div className="progress-fill" style={{ width: `${r.score}%`, background: `linear-gradient(90deg, #6366f1, #8b5cf6)` }} />
                  </div>
                </td>
                <td><span className={`badge ${STATUS_BADGE[r.status]}`}>{r.status === 'advancing' ? 'Đi tiếp' : r.status === 'eliminated' ? 'Đã loại' : r.status === 'finalist' ? 'Chung kết' : r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
