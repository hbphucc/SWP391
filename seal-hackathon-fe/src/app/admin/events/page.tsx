"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, Save, AlertCircle, Plus, Trash2, Edit2, Play, CheckCircle2 } from "lucide-react";
import { App, Modal } from "antd";

import { apiRequest } from "@/lib/api";

export default function AdminEventsPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  
  // Event Edit State
  const [isEventEditing, setIsEventEditing] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  // Round Edit State
  const [isRoundEditing, setIsRoundEditing] = useState(false);
  const [editingRound, setEditingRound] = useState<any>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiRequest<any[]>("/Events");
      setEvents(data);
      if (data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].eventId);
      }
    } catch (err: any) {
      message.error("Không thể tải sự kiện: " + err.message);
    }
  };

  const selectedEvent = events.find(e => e.eventId === selectedEventId);

  // --- EVENT ACTIONS ---
  const handleAddNewEvent = () => {
    setEditingEvent({
      eventName: "",
      description: "",
      startDate: new Date().toISOString().slice(0, 16),
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      maxTeamSize: 5
    });
    setIsEventEditing(true);
  };

  const handleEditEvent = (evt: any) => {
    setEditingEvent({
      eventId: evt.eventId,
      eventName: evt.eventName,
      description: evt.description || "",
      startDate: evt.startDate ? evt.startDate.slice(0, 16) : "",
      endDate: evt.endDate ? evt.endDate.slice(0, 16) : "",
      maxTeamSize: evt.maxTeamSize || 5
    });
    setIsEventEditing(true);
  };

  const handleSaveEvent = async () => {
    if (!editingEvent.eventName.trim()) return message.error("Vui lòng nhập tên sự kiện");
    try {
      if (editingEvent.eventId) {
        await apiRequest(`/Events/${editingEvent.eventId}`, {
          method: "PUT",
          body: JSON.stringify(editingEvent)
        });
        message.success("Cập nhật sự kiện thành công");
      } else {
        const result = await apiRequest<any>(`/Events`, {
          method: "POST",
          body: JSON.stringify(editingEvent)
        });
        const newId = result.eventId || result.id;
        setSelectedEventId(newId);
        message.success("Tạo sự kiện thành công");
        
        // Auto-generate standard hackathon rounds
        try {
          const standardRounds = [
            { roundName: "Vòng sơ khảo", roundOrder: 1, maxTeamsAdvancing: 30, submissionDeadline: editingEvent.endDate },
            { roundName: "Bán kết", roundOrder: 2, maxTeamsAdvancing: 10, submissionDeadline: editingEvent.endDate },
            { roundName: "Chung kết", roundOrder: 3, maxTeamsAdvancing: 3, submissionDeadline: editingEvent.endDate }
          ];
          for (const r of standardRounds) {
            await apiRequest(`/events/${newId}/rounds`, {
              method: "POST",
              body: JSON.stringify({ ...r, submissionDeadline: new Date(r.submissionDeadline).toISOString() })
            });
          }
          message.success("Đã tự động tạo các vòng thi tiêu chuẩn");
        } catch (roundErr) {
          console.error("Không thể tự động tạo các vòng thi", roundErr);
        }
      }
      setIsEventEditing(false);
      loadEvents();
    } catch (err: any) {
      message.error(err.message || "Lưu sự kiện thất bại");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    Modal.confirm({
      title: "Xóa Sự kiện?",
      content: "Hành động này sẽ xóa tất cả các vòng thi và dữ liệu liên quan.",
      onOk: async () => {
        try {
          await apiRequest(`/Events/${id}`, { method: "DELETE" });
          message.success("Đã xóa sự kiện");
          setSelectedEventId("");
          loadEvents();
        } catch (err: any) {
          message.error(err.message || "Xóa sự kiện thất bại");
        }
      }
    });
  };

  // --- ROUND ACTIONS ---
  const handleAddRound = () => {
    if (!selectedEvent) return;
    const currentRoundsCount = selectedEvent.rounds?.length || 0;
    if (currentRoundsCount >= 5) {
      return message.error("Một sự kiện hackathon không thể có quá 5 vòng thi.");
    }
    const nextOrder = currentRoundsCount + 1;
    setEditingRound({
      roundName: `Vòng thi ${nextOrder}`,
      submissionDeadline: selectedEvent.endDate ? selectedEvent.endDate.slice(0, 16) : "",
      roundOrder: nextOrder,
      maxTeamsAdvancing: 10
    });
    setIsRoundEditing(true);
  };

  const handleEditRound = (round: any) => {
    setEditingRound({
      roundId: round.roundId,
      roundName: round.roundName,
      submissionDeadline: round.submissionDeadline ? round.submissionDeadline.slice(0, 16) : "",
      roundOrder: round.roundOrder,
      maxTeamsAdvancing: round.maxTeamsAdvancing
    });
    setIsRoundEditing(true);
  };

  const handleSaveRound = async () => {
    if (!editingRound.roundName.trim() || !editingRound.submissionDeadline) {
      return message.error("Vui lòng điền các trường bắt buộc của vòng thi.");
    }
    if (editingRound.roundOrder > 5) {
      return message.error("Số thứ tự không thể vượt quá 5.");
    }
    if (editingRound.maxTeamsAdvancing > 500) {
      return message.error("Chỉ tiêu đội thi tiếp tục không thể vượt quá 500.");
    }

    // Logical Validations (Funnel & Sequence)
    const otherRounds = (selectedEvent.rounds || []).filter((r: any) => r.roundId !== editingRound.roundId);
    
    // Funnel Logic validation: Subsequent rounds must have fewer or equal advancing teams
    const invalidPreviousRounds = otherRounds.filter((r: any) => r.roundOrder < editingRound.roundOrder && r.maxTeamsAdvancing < editingRound.maxTeamsAdvancing);
    if (invalidPreviousRounds.length > 0) {
      return message.error(`Lỗi hình phễu: Một vòng thi trước (Thứ tự ${invalidPreviousRounds[0].roundOrder}) chỉ có ${invalidPreviousRounds[0].maxTeamsAdvancing} đội thi đi tiếp. Bạn không thể cho phép nhiều hơn số đó.`);
    }

    const invalidNextRounds = otherRounds.filter((r: any) => r.roundOrder > editingRound.roundOrder && r.maxTeamsAdvancing > editingRound.maxTeamsAdvancing);
    if (invalidNextRounds.length > 0) {
      return message.error(`Lỗi hình phễu: Một vòng thi sau (Thứ tự ${invalidNextRounds[0].roundOrder}) yêu cầu ${invalidNextRounds[0].maxTeamsAdvancing} đội thi. Bạn phải cho phép ít nhất bằng số đó.`);
    }
    
    // Ensure deadline is an ISO string suitable for C# DateTime
    const payload = {
      ...editingRound,
      submissionDeadline: new Date(editingRound.submissionDeadline).toISOString()
    };

    try {
      if (editingRound.roundId) {
        await apiRequest(`/events/${selectedEventId}/rounds/${editingRound.roundId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        message.success("Cập nhật vòng thi thành công");
      } else {
        await apiRequest(`/events/${selectedEventId}/rounds`, {
          method: "POST",
          body: JSON.stringify(payload)
        });
        message.success("Tạo vòng thi thành công");
      }
      setIsRoundEditing(false);
      loadEvents(); // Reload to get updated rounds
    } catch (err: any) {
      message.error(err.message || "Lưu vòng thi thất bại");
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    Modal.confirm({
      title: "Xóa Vòng thi?",
      onOk: async () => {
        try {
          await apiRequest(`/events/${selectedEventId}/rounds/${roundId}`, { method: "DELETE" });
          message.success("Đã xóa vòng thi");
          loadEvents();
        } catch (err: any) {
          message.error(err.message || "Xóa vòng thi thất bại");
        }
      }
    });
  };

  const handleAdvanceRound = async (roundId: string) => {
    Modal.confirm({
      title: "Tiến vào Vòng thi Tiếp theo?",
      content: "Hành động này sẽ khóa vòng thi này, tính điểm, loại các đội thi ngoài chỉ tiêu, và chuyển những đội còn lại vào vòng thi tiếp theo. Hành động này không thể hoàn tác.",
      okText: "Đồng ý, Tiếp tục Đội thi",
      okType: "danger",
      onOk: async () => {
        try {
          message.loading({ content: "Đang tiến hành cho các đội thi đi tiếp...", key: "advance" });
          const res = await apiRequest<any>(`/admin/rounds/${roundId}/advance`, { method: "POST" });
          message.success({ content: `Đã thành công cho ${res.advancedTeams?.length || 0} đội thi đi tiếp và loại ${res.eliminatedTeams?.length || 0} đội thi.`, key: "advance", duration: 5 });
          loadEvents();
        } catch (err: any) {
          message.error({ content: err.message || "Tiến hành vòng thi thất bại", key: "advance" });
        }
      }
    });
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cấu hình Sự kiện & Vòng thi</h1>
          <p className="page-subtitle">Quản lý các giai đoạn hackathon, quy trình nhiều vòng thi, và hạn chót</p>
        </div>
        {!isEventEditing && (
          <button className="btn btn-primary" onClick={handleAddNewEvent}>
            <Plus size={16} /> Tạo Sự kiện Mới
          </button>
        )}
      </div>

      {isEventEditing && (
        <div className="glass-card" style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>{editingEvent.eventId ? "Chỉnh sửa Sự kiện" : "Tạo Sự kiện Mới"}</h3>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Tên Sự kiện</label>
            <input 
              className="form-input" 
              placeholder="Tên Sự kiện (vd: Summer Hackathon 2026)" 
              value={editingEvent.eventName} 
              onChange={e => setEditingEvent({...editingEvent, eventName: e.target.value})} 
            />
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Mô tả</label>
            <textarea 
              className="form-input" 
              value={editingEvent.description} 
              onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} 
            />
          </div>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ngày bắt đầu</label>
              <input type="datetime-local" className="form-input" value={editingEvent.startDate} onChange={e => setEditingEvent({...editingEvent, startDate: e.target.value})} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Ngày kết thúc</label>
              <input type="datetime-local" className="form-input" value={editingEvent.endDate} onChange={e => setEditingEvent({...editingEvent, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Quy mô Đội thi Tối đa</label>
            <input type="number" min="1" className="form-input" value={editingEvent.maxTeamSize} onChange={e => setEditingEvent({...editingEvent, maxTeamSize: Number(e.target.value)})} />
          </div>
          
          <div style={{ display: "flex", gap: "1rem" }}>
            <button className="btn btn-primary" onClick={handleSaveEvent}><Save size={16} /> Lưu Thay đổi</button>
            <button className="btn btn-ghost" onClick={() => setIsEventEditing(false)}>Hủy</button>
          </div>
        </div>
      )}

      {events.length > 0 && selectedEvent && !isEventEditing && (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Thiết lập Quy trình Sự kiện
            </h3>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-icon btn-secondary" onClick={() => handleEditEvent(selectedEvent)}><Edit2 size={14}/></button>
              <button className="btn btn-icon btn-danger" style={{ background: "transparent" }} onClick={() => handleDeleteEvent(selectedEvent.eventId)}><Trash2 size={14}/></button>
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Chọn Sự kiện Hoạt động</label>
              <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)} style={{ cursor: "pointer", fontWeight: "bold" }}>
                {events.map(e => (
                  <option key={e.eventId} value={e.eventId}>{e.eventName}</option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "var(--color-text)" }}>Giai đoạn / Vòng thi Sự kiện</h4>
                {!isRoundEditing && (selectedEvent.rounds?.length || 0) < 5 && (
                  <button className="btn btn-secondary btn-sm" onClick={handleAddRound}>
                    <Plus size={14} /> Thêm Vòng thi
                  </button>
                )}
              </div>

              {isRoundEditing && (
                <div className="glass-card" style={{ marginBottom: "1.5rem", background: "var(--color-surface-2)" }}>
                  <h4 style={{ marginBottom: "1rem" }}>{editingRound.roundId ? "Chỉnh sửa Vòng thi" : "Thêm Vòng thi Mới"}</h4>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Tên Vòng thi</label>
                    <input className="form-input" value={editingRound.roundName} onChange={e => setEditingRound({...editingRound, roundName: e.target.value})} />
                  </div>
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Số thứ tự</label>
                      <input type="number" min="1" max="5" className="form-input" value={editingRound.roundOrder} disabled style={{ backgroundColor: "var(--color-surface)", cursor: "not-allowed", opacity: 0.7 }} />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label">Chỉ tiêu Đội thi Đi tiếp</label>
                      <input type="number" min="1" max="500" className="form-input" value={editingRound.maxTeamsAdvancing} onChange={e => setEditingRound({...editingRound, maxTeamsAdvancing: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: "1rem" }}>
                    <label className="form-label">Hạn chót Nộp bài</label>
                    <input type="datetime-local" className="form-input" value={editingRound.submissionDeadline} onChange={e => setEditingRound({...editingRound, submissionDeadline: e.target.value})} />
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    <button className="btn btn-primary" onClick={handleSaveRound}><Save size={14}/> Lưu Thay đổi</button>
                    <button className="btn btn-ghost" onClick={() => setIsRoundEditing(false)}>Hủy</button>
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(selectedEvent.rounds || []).sort((a:any, b:any) => a.roundOrder - b.roundOrder).map((round: any, index: number) => (
                  <div key={round.roundId} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--color-surface-2)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-2)" }}>
                    
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontWeight: "bold" }}>
                      {round.roundOrder}
                    </div>

                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginBottom: "0.4rem" }}>Tên Vòng thi</label>
                      <div style={{ fontWeight: "bold", color: "var(--color-text)" }}>{round.roundName}</div>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginBottom: "0.4rem" }}>Hạn chót Nộp bài</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Clock size={14} style={{ color: "var(--color-text-3)" }} />
                        <span style={{ color: "var(--color-text-2)" }}>{new Date(round.submissionDeadline).toLocaleString()}</span>
                      </div>
                    </div>

                    <div style={{ flex: 1 }}>
                       <label className="form-label" style={{ marginBottom: "0.4rem" }}>Chỉ tiêu Đi tiếp</label>
                       <div style={{ color: "var(--color-text-2)" }}>Top {round.maxTeamsAdvancing} Đội thi</div>
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                       <div style={{ display: "flex", gap: "0.5rem" }}>
                         <button className="btn btn-sm btn-primary" onClick={() => handleAdvanceRound(round.roundId)}>
                           <Play size={14} /> Tiếp tục Đội thi
                         </button>
                         <button className="btn btn-icon btn-secondary" onClick={() => handleEditRound(round)}>
                           <Edit2 size={14} />
                         </button>
                         <button className="btn btn-icon btn-danger" style={{ background: "transparent", color: "var(--color-rose)" }} onClick={() => handleDeleteRound(round.roundId)}>
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem", background: "rgba(245,158,11,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertCircle size={16} style={{ color: "var(--color-warning)" }} /> Tiến hành cho các đội thi đi tiếp sẽ tính điểm vĩnh viễn cho vòng thi này và chuyển những đội thắng cuộc vào vòng thi tiếp theo dựa trên chỉ tiêu của bạn.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
