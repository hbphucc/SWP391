"use client";
import { useState, useEffect } from "react";
import { Target, Clock, CheckCircle, AlertCircle, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";


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
  const [calibrationDone, setCalibrationDone] = useState(false);
  
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const { apiRequest } = await import("@/lib/api");
        const events = await apiRequest<any[]>("/Events");
        if (events.length > 0) {
          const eventDetails = await apiRequest<any>(`/Events/${events[0].eventId}`);
          if (eventDetails.rounds && eventDetails.rounds.length > 0) {
            const firstRound = eventDetails.rounds[0].roundId;
            const data = await apiRequest<any[]>(`/submissions/round/${firstRound}`);
            
            const mapped = data.map((d: any) => ({
              id: d.submissionId,
              team: d.team?.teamName || "Đội thi Không xác định",
              track: d.team?.category || "Chung",
              round: eventDetails.rounds[0].roundName,
              status: "pending",
              deadline: "Không có"
            }));
            setQueueData(mapped);
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
  const tabLabels: Record<string, string> = { all: "Tất cả", pending: "Chờ xử lý", scored: "Bản nháp", locked: "Đã khóa" };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Chấm điểm & Đánh giá</h1>
          <p className="page-subtitle">Đánh giá các đội thi dựa trên tiêu chí SEAL</p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
        <button className={`btn ${activeTab === "queue" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("queue")}>
          <Target size={16} /> Hàng đợi Chấm điểm
        </button>
        <button className={`btn ${activeTab === "calibration" ? "btn-primary" : "btn-secondary"}`} onClick={() => setActiveTab("calibration")}>
          <Filter size={16} /> Phòng Hiệu chuẩn
        </button>
      </div>

      {activeTab === "calibration" && (
        <div className="glass-card">
          <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Vòng Hiệu chuẩn</h3>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1.5rem", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Để đảm bảo độ tin cậy cao giữa các giám khảo, tất cả giám khảo phải chấm một bài nộp mẫu trước khi chấm điểm các đội thi thật. 
            Sau khi nộp, điểm của bạn sẽ được so sánh với đánh giá chung của chuyên gia để giúp bạn hiệu chuẩn kỳ vọng của mình.
          </p>

          {!calibrationDone ? (
            <div style={{ background: "rgba(15,23,42,0.4)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "1rem" }}>Dự án Mẫu: "EcoTrack Mobile App"</div>
              <ul style={{ paddingLeft: "1.5rem", marginBottom: "1.5rem", color: "var(--color-text-2)", fontSize: "0.9rem", display: "flex", flexDirection: "column", gap: 6 }}>
                <li><strong>Kỹ thuật:</strong> React Native + Firebase. CRUD cơ bản hoạt động, nhưng tích hợp bản đồ còn lỗi.</li>
                <li><strong>Đổi mới:</strong> Ý tưởng khá phổ biến (theo dõi dấu chân carbon), nhưng việc ứng dụng game hóa là một điểm cộng tốt.</li>
                <li><strong>Trình bày:</strong> Bài thuyết trình được cấu trúc tốt, nhưng bản demo trực tiếp bị sập một lần.</li>
              </ul>
              <button className="btn btn-primary" onClick={() => setCalibrationDone(true)}>
                Chấm điểm mẫu này
              </button>
            </div>
          ) : (
            <div style={{ background: "rgba(16,185,129,0.1)", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(16,185,129,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--color-emerald)", fontWeight: 700, fontSize: "1.1rem", marginBottom: "1rem" }}>
                <CheckCircle size={20} /> Hoàn thành Hiệu chuẩn!
              </div>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-2)", marginBottom: "1rem" }}>
                Thói quen chấm điểm của bạn đã được phân tích. Bạn có xu hướng chấm điểm <strong>hơi khắt khe hơn</strong> về phần "Trình bày" so với mức chuẩn của chuyên gia. Vui lòng ghi nhớ điều này trong quá trình đánh giá thực tế để duy trì sự công bằng.
              </p>
              <button className="btn btn-primary" onClick={() => setActiveTab("queue")}>
                Đi đến Hàng đợi Chấm điểm →
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "queue" && (
        <>
          <div className="grid-3" style={{ marginBottom: "2rem" }}>
            {[
              { label: "Chờ xử lý",  val: queueData.filter(q=>q.status==="pending").length, color: "#f59e0b" },
              { label: "Bản nháp", val: queueData.filter(q=>q.status==="scored").length,  color: "#06b6d4" },
              { label: "Đã khóa",   val: queueData.filter(q=>q.status==="locked").length,  color: "#10b981" },
            ].map(s => (
              <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="tabs" style={{ marginBottom: "1.5rem" }}>
            {["all","pending","scored","locked"].map(f => (
              <button key={f} className={`tab-btn ${filter===f?"active":""}`} onClick={() => setFilter(f)}>
                {tabLabels[f]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filtered.map(q => (
              <div key={q.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
                {STATUS_ICON[q.status]}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{q.team}</div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                    {q.track} · {q.round} · Hạn chót: {q.deadline}
                  </div>
                </div>
                <span className={`badge ${q.status==="pending"?"badge-warning":q.status==="locked"?"badge-success":"badge-cyan"}`}>
                  {tabLabels[q.status]}
                </span>
                <Link href={`/admin/judging/${q.id}`}>
                  <button className={`btn btn-sm ${q.status==="locked"?"btn-ghost":"btn-primary"}`} disabled={q.status==="locked"}>
                    {q.status==="locked" ? "Đã khóa" : q.status==="scored" ? "Tiếp tục →" : "Chấm điểm ngay"} <ChevronRight size={13} />
                  </button>
                </Link>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state">
              <Target size={48} className="empty-icon" />
              <div className="empty-title">Không có bài nộp nào trong hàng đợi</div>
              <div className="empty-desc">Bạn đã hoàn tất mọi thứ!</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
