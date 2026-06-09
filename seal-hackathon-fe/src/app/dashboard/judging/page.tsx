"use client";
import { useState, useEffect } from "react";
import { Target, Clock, CheckCircle, AlertCircle, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";

const QUEUE = [
  { id: 1, team: "CodeCraft",    track: "AI & ML",    round: "Qualifying", status: "pending",   deadline: "May 15" },
  { id: 2, team: "InnovateSEAL", track: "Web Dev",    round: "Qualifying", status: "scored",    deadline: "May 15" },
  { id: 3, team: "AlphaCoders",  track: "Mobile App", round: "Qualifying", status: "pending",   deadline: "May 15" },
  { id: 4, team: "ByteBuilders", track: "Open Innov", round: "Qualifying", status: "pending",   deadline: "May 15" },
  { id: 5, team: "TechVision",   track: "AI & ML",    round: "Qualifying", status: "locked",    deadline: "May 15" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <AlertCircle size={14} style={{ color: "#f59e0b" }} />,
  scored:  <Clock size={14} style={{ color: "#06b6d4" }} />,
  locked:  <CheckCircle size={14} style={{ color: "#10b981" }} />,
};

export default function JudgingQueuePage() {
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "calibration"
  const [filter, setFilter] = useState("all");
  const [queueData, setQueueData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    const user = JSON.parse(userStr || "{}");
    setCurrentUser(user);

    const fetchSubmissions = async () => {
      try {
        if (user.role?.toLowerCase() === "judge") {
          const { apiRequest } = await import("@/lib/api");
          const data = await apiRequest<any[]>("/judge/scores/my-assigned-submissions");
          
          const mapped = data.map((d: any) => ({
            id: d.submissionId,
            team: d.team?.teamName,
            track: d.team?.category,
            round: d.round?.roundName,
            status: "pending", // Currently hardcoded to pending since API doesn't return score status yet
            deadline: "N/A", // Not returned by API
            repoUrl: d.repositoryUrl,
            demoUrl: d.demoUrl
          }));
          setQueueData(mapped);
        } else if (user.role?.toLowerCase() === "admin") {
          const { apiRequest } = await import("@/lib/api");
          const events = await apiRequest<any[]>("/Events");
          if (events.length > 0) {
            const eventDetails = await apiRequest<any>(`/Events/${events[0].eventId}`);
            if (eventDetails.rounds && eventDetails.rounds.length > 0) {
              const firstRound = eventDetails.rounds[0].roundId;
              const data = await apiRequest<any[]>(`/submissions/round/${firstRound}`);
              
              const mapped = data.map((d: any) => ({
                id: d.submissionId,
                team: d.team?.teamName,
                track: d.team?.category,
                round: eventDetails.rounds[0].roundName,
                status: "pending",
                deadline: "N/A",
                repoUrl: d.repositoryUrl,
                demoUrl: d.demoUrl
              }));
              setQueueData(mapped);
            }
          }
        }
      } catch(e) {
        console.error("Failed to fetch submissions:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmissions();
  }, []);

  const filtered = queueData.filter(q => filter === "all" ? true : q.status === filter);
  const [calibrationDone, setCalibrationDone] = useState(false);

  if (loading) return <div style={{ padding: "2rem" }}>Đang tải bài nộp...</div>;
  if (currentUser?.role?.toLowerCase() !== "judge" && currentUser?.role?.toLowerCase() !== "admin") {
    return <div style={{ padding: "2rem" }}>Bạn không có quyền xem danh sách chấm điểm.</div>;
  }

  return (
    <div style={{ height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
        <div>
          <h1 className="page-title">Kết quả chấm điểm</h1>
          <p className="page-subtitle">Xem tiến độ đánh giá và điểm số của các đội thi</p>
        </div>
      </div>


          <div className="grid-3" style={{ marginBottom: "2rem" }}>
            {[
              { label: "Chờ duyệt",  val: queueData.filter(q=>q.status==="pending").length, color: "#f59e0b" },
              { label: "Bản nháp", val: queueData.filter(q=>q.status==="scored").length,  color: "#06b6d4" },
              { label: "Đã chốt",   val: queueData.filter(q=>q.status==="locked").length,  color: "#10b981" },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            {["all","pending","scored","locked"].map(f => {
              const labels: Record<string, string> = { all: "Tất cả", pending: "Chờ duyệt", scored: "Bản nháp", locked: "Đã chốt" };
              return (
              <button key={f} className={`tab-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                {labels[f]}
              </button>
            )})}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem" }}>
            {filtered.map(q => (
              <div key={q.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", flexShrink: 0 }}>
                {STATUS_ICON[q.status]}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{q.team}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                    {q.track} · {q.round} · Hạn chót: {q.deadline}
                  </div>
                </div>
                <span className={`badge ${q.status==="pending"?"badge-warning":q.status==="locked"?"badge-success":"badge-cyan"}`}>
                  {({ pending: "Chờ duyệt", scored: "Bản nháp", locked: "Đã chốt" } as Record<string, string>)[q.status] || q.status}
                </span>
                <Link href={`/dashboard/judging/${q.id}`}>
                  <button className="btn btn-sm btn-secondary">
                    Xem kết quả <ChevronRight size={13} />
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <Target size={48} className="empty-icon" />
              <div className="empty-title">Không có bài nộp nào trong hàng đợi</div>
              <div className="empty-desc">Bạn đã hoàn thành tất cả!</div>
            </div>
          )}
    </div>
  );
}
