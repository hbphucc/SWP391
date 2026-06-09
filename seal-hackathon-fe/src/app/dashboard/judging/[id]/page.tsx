"use client";
import { useState, useEffect, use } from "react";
import { Target, Clock, MessageSquare, Lock, CheckCircle, ChevronLeft, Send, AlertCircle } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { App } from "antd";

export default function JudgingScorePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;
  const { message } = App.useApp();
  const [submission, setSubmission] = useState<any>(null);
  const [criteria, setCriteria] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<string,number>>({});
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
        const user = JSON.parse(userStr || "{}");
        setCurrentUser(user);

        const { apiRequest } = await import("@/lib/api");
        
        let allSubmissions = [];
        if (user.role?.toLowerCase() === "judge") {
          allSubmissions = await apiRequest<any[]>("/judge/scores/my-assigned-submissions");
        } else if (user.role?.toLowerCase() === "admin") {
          const events = await apiRequest<any[]>("/Events");
          if (events.length > 0) {
            const eventDetails = await apiRequest<any>(`/Events/${events[0].eventId}`);
            if (eventDetails.rounds && eventDetails.rounds.length > 0) {
              const firstRound = eventDetails.rounds[0].roundId;
              allSubmissions = await apiRequest<any[]>(`/submissions/round/${firstRound}`);
            }
          }
        }
        
        const sub = allSubmissions.find((s: any) => s.submissionId === submissionId);
        if (sub) {
          setSubmission({
            id: sub.submissionId,
            team: sub.team?.teamName,
            track: sub.team?.category,
            roundId: sub.round?.roundId || sub.roundId,
            roundName: sub.round?.roundName || "Vòng thi không xác định",
            repoUrl: sub.repositoryUrl || "#",
            demoUrl: sub.demoUrl || "#",
            reportUrl: sub.slideUrl || "#",
            submittedAt: new Date(sub.submittedAt || Date.now()).toLocaleString(),
            status: "pending"
          });

          // Fetch criteria for this round
          const roundId = sub.round?.roundId || sub.roundId;
          if (roundId) {
            const critData = await apiRequest<any[]>(`/rounds/${roundId}/criteria`);
            setCriteria(critData);
            
            // Initialize scores
            const initialScores: Record<string, number> = {};
            critData.forEach(c => initialScores[c.criteriaId] = 0);
            setScores(initialScores);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [submissionId]);

  const handleScoreChange = (criteriaId: string, value: number) => {
    setScores(prev => ({ ...prev, [criteriaId]: value }));
  };

  const handleSubmitScore = async () => {
    if (!submission) return;
    try {
      const { apiRequest } = await import("@/lib/api");
      
      for (const crit of criteria) {
        await apiRequest("/judge/scores", {
          method: "POST",
          body: JSON.stringify({
            submissionId: submission.id,
            criteriaId: crit.criteriaId,
            scoreValue: scores[crit.criteriaId],
            comment: feedback
          })
        });
      }
      
      message.success("Nộp điểm thành công!");
      setSubmission({ ...submission, status: "scored" });
    } catch (e: any) {
      message.error(e.message || "Nộp điểm thất bại");
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Đang tải chi tiết bài nộp...</div>;
  if (!submission) return <div style={{ padding: "2rem" }}>Không tìm thấy bài nộp hoặc bị từ chối truy cập.</div>;

  const locked = submission.status === "locked" || submission.status === "scored";
  const isJudge = currentUser?.role?.toLowerCase() === "judge";

  let weightedTotal = 0;
  if (criteria.length > 0) {
    weightedTotal = criteria.reduce((sum, c) => {
      const s = scores[c.criteriaId] || 0;
      return sum + (s / (c.maxScore || 100)) * c.weight; // weight is out of 100
    }, 0);
  }
  
  const getScoreColor = (s: number) => s >= 80 ? "#10b981" : s >= 60 ? "#f59e0b" : "#f43f5e";

  return (
    <div style={{ maxWidth: 800, height: "calc(100vh - 100px)", overflowY: "auto", overflowX: "hidden", paddingRight: "10px" }}>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/judging"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">Chấm điểm bài nộp</h1>
          </div>
          <p className="page-subtitle">{submission.team} · {submission.track} · {submission.roundName}</p>
        </div>
        {locked && <span className="badge badge-success" style={{ padding: "0.4rem 0.8rem" }}><CheckCircle size={12} style={{ marginRight: 4 }}/> Điểm đã chốt</span>}
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <h4 style={{ fontSize: "0.9rem", marginBottom: "1rem", color: "var(--color-text-2)" }}>LIÊN KẾT BÀI NỘP</h4>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {[
            { label: "Kho lưu trữ GitHub", url: submission.repoUrl },
            { label: "Bản demo trực tiếp",         url: submission.demoUrl },
            { label: "Báo cáo / Slide",   url: submission.reportUrl },
          ].map(l => (
            <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
              {l.label} ↗
            </a>
          ))}
        </div>
        <div style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "var(--color-text-3)" }}>
          <Clock size={11} style={{ marginRight: 4 }} />Đã nộp: {submission.submittedAt}
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h4 style={{ fontSize: "0.95rem" }}>Tiêu chí chấm điểm</h4>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor(weightedTotal) }}>
              {weightedTotal.toFixed(1)}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>Tổng điểm có trọng số</div>
          </div>
        </div>

        {locked && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
            <CheckCircle size={16} style={{ color: "#34d399" }} />
            <span style={{ fontSize: "0.875rem", color: "#34d399" }}>Đánh giá đã được chốt.</span>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {criteria.length === 0 && <div style={{ color: "var(--color-text-3)" }}>Không có tiêu chí nào được định nghĩa cho vòng thi này.</div>}
            {criteria.map(c => (
              <div key={c.criteriaId}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{c.criteriaName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>Điểm tối đa: {c.maxScore}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                    <span className="badge badge-neutral">{c.weight}%</span>
                    <div style={{ minWidth: 52, textAlign: "center", fontSize: "1.3rem", fontWeight: 800, fontFamily: "var(--font-display)", color: getScoreColor((scores[c.criteriaId] || 0) / (c.maxScore || 100) * 100) }}>
                      {scores[c.criteriaId] ?? 0}
                    </div>
                  </div>
                </div>
                <input
                  type="range" min="0" max={c.maxScore || 100} step="1"
                  className="score-slider"
                  disabled={!isJudge || locked}
                  value={scores[c.criteriaId] ?? 0}
                  onChange={(e) => handleScoreChange(c.criteriaId, parseInt(e.target.value))}
                  style={{ background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${((scores[c.criteriaId] ?? 0) / (c.maxScore || 100)) * 100}%, rgba(148,163,184,0.15) ${((scores[c.criteriaId] ?? 0) / (c.maxScore || 100)) * 100}%, rgba(148,163,184,0.15) 100%)` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <MessageSquare size={16} style={{ color: "var(--color-primary)" }} />
          <h4 style={{ fontSize: "0.95rem" }}>Nhận xét & Đánh giá</h4>
        </div>
        <textarea
          className="form-textarea"
          rows={4}
          placeholder="Cung cấp nhận xét cho đội thi..."
          disabled={!isJudge || locked}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </div>

      {isJudge && !locked && (
        <button className="btn btn-primary btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={handleSubmitScore}>
          <Send size={18} /> Nộp điểm
        </button>
      )}

    </div>
  );
}
