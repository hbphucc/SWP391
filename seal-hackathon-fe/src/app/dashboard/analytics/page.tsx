"use client";
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from "recharts";
import { Download, Info, TrendingUp } from "lucide-react";
import { apiRequest } from "@/lib/api";

const AGREE_COLOR: Record<string, string> = {
  "Very High": "badge-success",
  "High":      "badge-primary",
  "Moderate":  "badge-warning",
  "Low":       "badge-danger",
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const events = await apiRequest<any[]>("/Events");
        if (events.length > 0) {
          const eventDetails = await apiRequest<any>(`/Events/${events[0].eventId}`);
          if (eventDetails.rounds && eventDetails.rounds.length > 0) {
            const firstRound = eventDetails.rounds[0].roundId;
            const analytics = await apiRequest<any>(`/analytics/round/${firstRound}`);
            setData(analytics);
          }
        }
      } catch (err) {
        console.error("Error fetching analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const exportAnalyticsCSV = () => {
    if (!data) return;
    const header = "Criterion,ICC,Alpha,Agreement\n";
    const rows = data.iccData.map((d: any) => `${d.criterion},${d.icc},${d.alpha},${d.agreement}`).join("\n");
    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analytics_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div style={{ padding: "2rem" }}>Đang tải dữ liệu...</div>;

  // Fallback if data is empty or API fails
  const safeData = data || {
    summary: { avgICC: "0.000", avgAlpha: "0.00", judgesCount: 0, submissionsCount: 0 },
    iccData: [],
    radarData: [],
    varianceData: []
  };

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Nghiên cứu & Phân tích</h1>
          <p className="page-subtitle">Phân tích độ tin cậy liên giám khảo (ICC) · SEAL Spring 2026</p>
        </div>
        <button className="btn btn-secondary" onClick={exportAnalyticsCSV} disabled={!data}><Download size={15} style={{ marginRight: "0.5rem" }} /> Xuất CSV</button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
        {/* RQ Banner */}
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-lg)", padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <Info size={18} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-1)" }}>Câu hỏi nghiên cứu</div>
              <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)" }}>
                <strong style={{ color: "var(--color-text-1)" }}>RQ:</strong> Điểm đánh giá hackathon nhất quán như thế nào giữa các giám khảo khác nhau khi chấm cùng một bài thi trong các cuộc thi kỹ thuật phần mềm học thuật?
              </p>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2rem" }}>
          {[
            { label: "ICC Tổng thể",       val: safeData.summary.avgICC,  color: "#10b981",  sub: "Tương quan nội bộ" },
            { label: "Krippendorff α Trung bình", val: safeData.summary.avgAlpha, color: "#6366f1",  sub: "Hệ số Alpha" },
            { label: "Giám khảo phân tích",   val: safeData.summary.judgesCount, color: "#06b6d4",  sub: "Giám khảo hoạt động" },
            { label: "Bài nộp",       val: safeData.summary.submissionsCount, color: "#f59e0b",  sub: "Tổng số trong vòng thi" },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginTop: "0.25rem", color: "var(--color-text-1)" }}>{s.label}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", marginBottom: "2rem" }}>
          {/* ICC by Criterion */}
          <div className="glass-card">
            <h4 style={{ marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--color-text-1)" }}>
              <TrendingUp size={16} style={{ color: "var(--color-primary)" }} /> ICC theo tiêu chí
            </h4>
            {safeData.iccData.length === 0 ? (
              <div style={{ color: "var(--color-text-3)", textAlign: "center", padding: "2rem 0" }}>Không có dữ liệu chấm điểm.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {safeData.iccData.map((d: any) => (
                  <div key={d.criterion}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontWeight: 500, color: "var(--color-text-2)" }}>{d.criterion}</span>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <span className={`glass-badge ${AGREE_COLOR[d.agreement] || "badge-neutral"}`}>{d.agreement}</span>
                        <strong style={{ color: "var(--color-text-1)" }}>{d.icc}</strong>
                      </div>
                    </div>
                    <div className="progress" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <div className="progress-fill" style={{
                        width: `${d.icc * 100}%`,
                        background: d.icc >= 0.8 ? "linear-gradient(90deg,#10b981,#34d399)" : d.icc >= 0.65 ? "linear-gradient(90deg,#6366f1,#8b5cf6)" : "linear-gradient(90deg,#f59e0b,#fbbf24)",
                      }} />
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginTop: "0.4rem" }}>
                      Krippendorff α: {d.alpha}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Radar: Internal vs Guest */}
          <div className="glass-card">
            <h4 style={{ marginBottom: "1.25rem", color: "var(--color-text-1)" }}>So sánh loại giám khảo</h4>
            {safeData.radarData.length === 0 ? (
               <div style={{ color: "var(--color-text-3)", textAlign: "center", padding: "2rem 0" }}>Không đủ dữ liệu.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={safeData.radarData}>
                  <PolarGrid stroke="rgba(148,163,184,0.1)" />
                  <PolarAngleAxis dataKey="criterion" tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                  <PolarRadiusAxis domain={[0, 'auto']} tick={{ fill: "var(--color-text-3)", fontSize: 10 }} />
                  <Radar name="Giám khảo nội bộ" dataKey="internalAvg" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                  <Radar name="Giám khảo khách mời"    dataKey="guestAvg"    stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} />
                  <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
                  <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Score Variance Chart */}
        <div className="glass-card" style={{ marginBottom: "1rem" }}>
          <h4 style={{ marginBottom: "1.25rem", color: "var(--color-text-1)" }}>Phương sai điểm số giữa các giám khảo (theo Đội thi)</h4>
          {safeData.varianceData.length === 0 ? (
             <div style={{ color: "var(--color-text-3)", textAlign: "center", padding: "2rem 0" }}>Không có dữ liệu phương sai. Các đội thi cần được giám khảo chấm điểm.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={safeData.varianceData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "var(--color-text-2)", fontSize: 12 }} />
                <YAxis domain={[0, 'auto']} tick={{ fill: "var(--color-text-3)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--color-bg-3)", border: "1px solid var(--color-border)", borderRadius: 8, color: "var(--color-text)" }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Legend wrapperStyle={{ fontSize: 12, color: "var(--color-text-2)" }} />
                {Object.keys(safeData.varianceData[0] || {}).filter(k => k.startsWith('J')).map((key, i) => (
                   <Bar key={key} dataKey={key} name={`Giám khảo ${i + 1}`} fill={i % 3 === 0 ? "#6366f1" : i % 3 === 1 ? "#8b5cf6" : "#06b6d4"} radius={[4,4,0,0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
