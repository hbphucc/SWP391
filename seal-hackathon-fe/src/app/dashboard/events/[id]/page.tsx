"use client";
import { useEffect, useState, use } from "react";
import { ChevronLeft, Users, Target, UserCheck, Clock, Trophy, Edit2, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { Modal, Select, Input, App } from "antd";

import { apiRequest } from "@/lib/api";

const STATUS_ROUND: Record<string, string> = { active: "badge-success", upcoming: "badge-primary", ended: "badge-neutral" };
const TRACK_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b"];

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const eventId = resolvedParams.id;
  const { message } = App.useApp();
  const [event, setEvent] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [tab, setTab] = useState("overview");
  const [regVisible, setRegVisible] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [track, setTrack] = useState(undefined);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        console.log("Fetching event with ID:", eventId);
        const data = await apiRequest<any>(`/Events/${eventId}`);
        console.log("Event data received:", data);
        setEvent(data);
      } catch (e: any) {
        console.error("Fetch Event Error:", e);
        setErrorMsg(e.message || "Tải chi tiết sự kiện thất bại");
        message.error("Tải chi tiết sự kiện thất bại");
      }
    };
    if (eventId) {
      fetchEvent();
    } else {
      setErrorMsg("Invalid event ID");
    }
  }, [eventId]);

  const handleRegister = async () => {
    try {
      // Find track id
      const selectedCat = event?.categories?.find((c: any) => c.categoryName === track);
      if (!selectedCat) throw new Error("Chưa chọn đúng hạng mục");

      await apiRequest("/Teams", {
        method: "POST",
        body: JSON.stringify({
          teamName: teamName,
          categoryId: selectedCat.categoryId,
          memberIds: []
        })
      });

      setIsRegistered(true);
      setRegVisible(false);
      message.success("Đăng ký đội thi tham gia hackathon thành công!");
    } catch (e: any) {
      message.error(e.message || "Đăng ký đội thi thất bại.");
    }
  };

  if (errorMsg) return <div style={{ padding: "2rem", color: "red" }}>Lỗi: {errorMsg} <br/> ID sự kiện: {eventId}</div>;
  if (!event) return <div style={{ padding: "2rem" }}>Đang tải chi tiết sự kiện... <br/> ID sự kiện: {eventId}</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <Link href="/dashboard/events"><button className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={16} /></button></Link>
            <h1 className="page-title">{event.eventName}</h1>
            <span className="badge badge-success">{event.status === "Ongoing" ? "Đang diễn ra" : event.status}</span>
          </div>
          <p className="page-subtitle">{event.description || "Sự kiện SEAL Hackathon"}</p>
        </div>
        {isRegistered ? (
          <button className="btn btn-secondary" disabled style={{ opacity: 0.7, cursor: "not-allowed" }}>
            <UserCheck size={15} /> Đã đăng ký
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => setRegVisible(true)}>
            <UserCheck size={15} /> Đăng ký đội thi
          </button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid-4" style={{ marginBottom: "2rem" }}>
        {[
          { icon: Target, label: "Hạng mục",  val: event.categories?.length || 0,   color: "#6366f1" },
          { icon: Users,  label: "Đội thi",   val: event.categories?.reduce((sum: number, c: any) => sum + (c.teamCount || 0), 0) || 0, color: "#8b5cf6" },
          { icon: UserCheck,label:"Giám khảo", val: 0,   color: "#06b6d4" },
          { icon: Clock,  label: "Vòng thi",  val: event.rounds?.length || 0,   color: "#f59e0b" },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="stat-card">
              <div className="stat-icon" style={{ background: `${s.color}22` }}>
                <Icon size={20} style={{ color: s.color }} />
              </div>
              <div>
                <div className="stat-value" style={{ background: "none", WebkitTextFillColor: s.color, color: s.color }}>{s.val}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["overview","rounds","tracks","judges"].map(t => {
          const labels: Record<string, string> = { overview: "Tổng quan", rounds: "Vòng thi", tracks: "Hạng mục", judges: "Giám khảo" };
          return (
          <button key={t} className={`tab-btn ${tab===t?"active":""}`} onClick={() => setTab(t)}>
            {labels[t]}
          </button>
        )})}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid-2">
          <div className="glass-card">
            <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--color-text-2)" }}>NGÀY QUAN TRỌNG</h4>
            {[
              { label: "Ngày bắt đầu", val: new Date(event.startDate).toLocaleDateString() },
              { label: "Ngày kết thúc",   val: new Date(event.endDate).toLocaleDateString() },
            ].map(d => (
              <div key={d.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--color-border)", fontSize: "0.875rem" }}>
                <span style={{ color: "var(--color-text-2)" }}>{d.label}</span>
                <strong>{d.val}</strong>
              </div>
            ))}
          </div>
          <div className="glass-card">
            <h4 style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "var(--color-text-2)" }}>TIẾN ĐỘ NỘP BÀI</h4>
            {(event.rounds || []).map((r: any) => (
              <div key={r.roundId} style={{ marginBottom: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginBottom: "0.4rem" }}>
                  <span style={{ fontWeight: 600 }}>{r.roundName}</span>
                  <span style={{ color: "var(--color-text-3)" }}>Hạn chót: {new Date(r.submissionDeadline).toLocaleDateString()}</span>
                </div>
                <div className="progress">
                  <div className="progress-fill" style={{ width: "0%" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rounds */}
      {tab === "rounds" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {(event.rounds || []).map((r: any, i: number) => (
            <div key={r.roundId} className="glass-card">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.85rem" }}>{r.roundOrder}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{r.roundName}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>Hạn chót: {new Date(r.submissionDeadline).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.82rem" }}>
                <div><span style={{ color: "var(--color-text-3)" }}>Vào vòng trong:</span> <strong>{r.maxTeamsAdvancing || "Tất cả"}</strong></div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
                <Link href={`/dashboard/judging`}><button className="btn btn-secondary btn-sm">Xem điểm</button></Link>
                <Link href={`/dashboard/rankings`}><button className="btn btn-ghost btn-sm"><Trophy size={13}/> Bảng xếp hạng</button></Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tracks */}
      {tab === "tracks" && (
        <div className="grid-2">
          {(event.categories || []).map((tr: any, idx: number) => {
            const color = TRACK_COLORS[idx % TRACK_COLORS.length];
            return (
              <Link key={tr.categoryId} href={`/dashboard/tracks/${tr.categoryId}`} style={{ textDecoration: "none" }}>
                <div className="glass-card" style={{ borderTop: `3px solid ${color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{tr.categoryName}</h4>
                    <span className="badge badge-primary"><Users size={10} /> {tr.teamCount || 0}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-2)" }}>
                    <Zap size={12} style={{ color: color, marginRight: 4 }} />Cố vấn: <strong style={{ color: "var(--color-text)" }}>Chưa phân công</strong>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Judges */}
      {tab === "judges" && (
        <div>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr>
                <th>Giám khảo</th><th>Loại</th><th>Hạng mục</th><th>Trạng thái</th>
              </tr></thead>
              <tbody>
                <tr><td colSpan={4} style={{textAlign: 'center', color: 'var(--color-text-3)'}}>Chưa có giám khảo nào được phân công.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        title="Đăng ký Hackathon"
        open={regVisible}
        onCancel={() => setRegVisible(false)}
        onOk={handleRegister}
        okText="Xác nhận đăng ký"
        okButtonProps={{ disabled: !teamName || !track }}
      >
        <div style={{ marginBottom: "1rem", color: "var(--color-text-2)", fontSize: "0.9rem" }}>
          Vui lòng tạo tên đội thi và chọn một hạng mục để tham gia hackathon này.
        </div>
        <div className="form-group" style={{ marginBottom: "1rem" }}>
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Tên đội thi</label>
          <Input placeholder="Nhập tên đội thi tuyệt vời của bạn" value={teamName} onChange={e => setTeamName(e.target.value)} size="large" />
        </div>
        <div className="form-group">
          <label className="form-label" style={{ marginBottom: "0.5rem", display: "block" }}>Chọn hạng mục</label>
          <Select style={{ width: "100%" }} size="large" placeholder="Chọn một hạng mục thi đấu" value={track} onChange={setTrack}>
            {(event.categories || []).map((t: any) => (
              <Select.Option key={t.categoryId} value={t.categoryName}>{t.categoryName}</Select.Option>
            ))}
          </Select>
        </div>
      </Modal>
    </div>
  );
}
