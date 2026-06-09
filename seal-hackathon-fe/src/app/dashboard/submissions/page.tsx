"use client";
import { useEffect,  useState } from "react";
import { Upload, Link as LinkIcon, GitBranch, Play, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { App } from "antd";

import { apiRequest } from "@/lib/api";

export default function SubmissionsPage() {
  const { message } = App.useApp();
  const [myTeam, setMyTeam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    repoUrl: "", demoUrl: "", reportUrl: "", videoUrl: "", description: "", consent: false
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser");
    if (userStr) setCurrentUser(JSON.parse(userStr));

    const fetchTeam = async () => {
      try {
        const team = await apiRequest<any>("/Teams/my-team");
        setMyTeam(team);
        if (team.submissions && team.submissions.length > 0) {
          setIsSubmitted(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.repoUrl || !form.reportUrl) {
      message.error("Yêu cầu nhập liên kết GitHub Repo và Báo cáo!");
      return;
    }
    if (!form.consent) {
      message.error("Bạn phải đồng ý với Quy định của Đội thi và Thể lệ Cuộc thi.");
      return;
    }
    if (!myTeam || !myTeam.currentRoundId) {
      message.error("Đội thi của bạn chưa được phân vào vòng thi nào.");
      return;
    }
    
    message.loading({ content: "Đang nộp dự án...", key: "submit" });
    try {
      await apiRequest("/Submissions", {
        method: "POST",
        body: JSON.stringify({
          teamId: myTeam.teamId,
          roundId: myTeam.currentRoundId,
          repositoryUrl: form.repoUrl,
          demoUrl: form.demoUrl,
          slideUrl: form.reportUrl
        })
      });
      message.success({ content: "Nộp dự án thành công!", key: "submit" });
      setIsSubmitted(true);
    } catch (err: any) {
      message.error({ content: err.message || "Nộp dự án thất bại!", key: "submit" });
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Đang tải...</div>;
  if (currentUser?.role?.toLowerCase()?.includes("judge")) {
    return <div style={{ padding: "2rem" }}>Tính năng này chỉ dành cho Thí sinh. Giám khảo không cần nộp bài thi.</div>;
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Nộp dự án</h1>
          <p className="page-subtitle">Nộp tài liệu dự án cuối cùng của bạn để chấm điểm</p>
        </div>
        {isSubmitted && <span className="badge badge-success"><CheckCircle size={14} style={{ marginRight: 4 }} /> Đã nộp</span>}
      </div>

      {!isSubmitted ? (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
            <AlertCircle size={20} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
            <div>
              <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--color-primary)", fontSize: "0.95rem" }}>Hướng dẫn nộp bài</h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-2)", lineHeight: 1.5 }}>
                Đảm bảo repository của bạn ở chế độ công khai hoặc giám khảo có thể truy cập. Báo cáo thuyết trình phải nêu rõ vấn đề, giải pháp và kiến trúc kỹ thuật. Bạn có thể cập nhật các liên kết này cho đến khi hết hạn.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label"><GitBranch size={14} /> URL GitHub Repository <span style={{ color: "#ef4444" }}>*</span></label>
              <input className="form-input" type="url" placeholder="https://github.com/your-username/project-repo" required value={form.repoUrl} onChange={e => setForm({...form, repoUrl: e.target.value})} />
            </div>
            
            <div className="form-group">
              <label className="form-label"><Play size={14} /> URL Demo Trực tiếp</label>
              <input className="form-input" type="url" placeholder="https://your-project-demo.vercel.app" value={form.demoUrl} onChange={e => setForm({...form, demoUrl: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label"><FileText size={14} /> URL Thuyết trình / Báo cáo <span style={{ color: "#ef4444" }}>*</span></label>
              <input className="form-input" type="url" placeholder="Liên kết Google Slides, Canva, hoặc PDF" required value={form.reportUrl} onChange={e => setForm({...form, reportUrl: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label"><LinkIcon size={14} /> URL Video Demo</label>
              <input className="form-input" type="url" placeholder="Liên kết YouTube hoặc Loom (tối đa 3 phút)" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} />
            </div>

            <div className="form-group">
              <label className="form-label">Mô tả ngắn / Lưu ý cho Giám khảo</label>
              <textarea className="form-textarea" rows={4} placeholder="Bất kỳ hướng dẫn cụ thể nào về cách chạy dự án của bạn..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            </div>

            <div className="form-group" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
              <input 
                type="checkbox" 
                id="consent" 
                style={{ marginTop: "0.25rem", width: "16px", height: "16px", cursor: "pointer" }} 
                checked={form.consent}
                onChange={e => setForm({...form, consent: e.target.checked})}
              />
              <label htmlFor="consent" style={{ fontSize: "0.9rem", color: "var(--color-text-2)", cursor: "pointer", lineHeight: 1.5 }}>
                <strong>Quy định & Đồng thuận Đội thi:</strong> Tôi xác nhận rằng tất cả thành viên trong đội thi đã đóng góp cho dự án này và chúng tôi đồng ý với Quy tắc Ứng xử và thể lệ chính thức của cuộc thi.
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2rem" }}>
                <Upload size={16} /> Nộp Dự án
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-card" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <CheckCircle size={64} style={{ color: "#10b981", margin: "0 auto 1.5rem" }} />
          <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.5rem" }}>Đã nhận bài nộp!</h2>
          <p style={{ color: "var(--color-text-2)", marginBottom: "2rem" }}>Dự án của bạn đã được nộp thành công để chấm điểm. Chúc may mắn!</p>
          <button className="btn btn-secondary" onClick={() => setIsSubmitted(false)}>Cập nhật bài nộp</button>
        </div>
      )}
    </div>
  );
}

