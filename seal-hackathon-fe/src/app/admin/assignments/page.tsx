"use client";
import { useState, useEffect } from "react";
import { Users, UserCheck, Shield, ChevronRight } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";

export default function JudgeAssignmentsPage() {
  const { message } = App.useApp();
  
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const [selectedRoundId, setSelectedRoundId] = useState<string>("");

  const [judges, setJudges] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadBaseData = async () => {
    setLoading(true);
    try {
      // Load Events (which include rounds)
      const eventsData = await apiRequest<any[]>("/Events");
      setEvents(eventsData);
      if (eventsData.length > 0) {
        setSelectedEventId(eventsData[0].eventId);
      }

      // Load Users (filter Judges)
      const usersData = await apiRequest<any[]>("/admin/users");
      const judgeUsers = usersData.filter(u => u.roles && u.roles.includes("Judge"));
      setJudges(judgeUsers);

      // Load all assignments
      loadAssignments();
    } catch (err: any) {
      message.error("Failed to load initial data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await apiRequest<any[]>("/admin/judge-assignments");
      setAssignments(data);
    } catch (err: any) {
      message.error("Failed to load assignments.");
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      // Load categories for this event
      apiRequest<any[]>(`/events/${selectedEventId}/categories`)
        .then(data => {
          setCategories(data);
          if (data.length > 0) setSelectedCategoryId(data[0].categoryId);
          else setSelectedCategoryId("");
        })
        .catch(() => message.error("Failed to load categories for event"));
      
      const event = events.find(e => e.eventId === selectedEventId);
      if (event && event.rounds && event.rounds.length > 0) {
        setSelectedRoundId(event.rounds[0].roundId);
      } else {
        setSelectedRoundId("");
      }
    }
  }, [selectedEventId, events]);

  const handleAssignJudge = async (judgeId: string) => {
    if (!selectedRoundId || !selectedCategoryId) {
      return message.warning("Please select a round and category first.");
    }
    
    try {
      await apiRequest("/admin/judge-assignments", {
        method: "POST",
        body: JSON.stringify({
          judgeId: judgeId,
          roundId: selectedRoundId,
          categoryId: selectedCategoryId
        })
      });
      message.success("Judge assigned successfully!");
      loadAssignments();
    } catch (err: any) {
      message.error(err.message || "Failed to assign judge");
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    try {
      await apiRequest(`/admin/judge-assignments/${assignmentId}`, { method: "DELETE" });
      message.success("Judge removed.");
      loadAssignments();
    } catch (err: any) {
      message.error(err.message || "Failed to remove judge");
    }
  };

  const selectedEvent = events.find(e => e.eventId === selectedEventId);
  
  // Filter assignments for the currently selected round and category
  const currentAssignments = assignments.filter(a => 
    a.round?.roundId === selectedRoundId && 
    a.category?.categoryId === selectedCategoryId
  );

  return (
    <div style={{ maxWidth: 1200 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserCheck size={28} /> Phân công Giám khảo
          </h1>
          <p className="page-subtitle">Phân công giám khảo chấm thi cho từng hạng mục cụ thể trong một vòng thi.</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginBottom: "2rem", display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <label className="form-label">Sự kiện</label>
          <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
            {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label className="form-label">Vòng thi</label>
          <select className="form-select" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
            {selectedEvent?.rounds?.map((r: any) => <option key={r.roundId} value={r.roundId}>{r.roundName}</option>)}
          </select>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <label className="form-label">Hạng mục (Track)</label>
          <select className="form-select" value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="glass-card"><p>Đang tải...</p></div>
      ) : (
        <div className="grid-2">
          <div className="glass-card">
            <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Users size={18} style={{ color: "var(--color-primary)" }} /> Giám khảo đã được phân công
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {currentAssignments.length === 0 ? (
                <p style={{ color: "var(--color-text-3)", fontStyle: "italic" }}>Chưa có giám khảo nào được phân công cho hạng mục này.</p>
              ) : (
                currentAssignments.map((assignment: any) => (
                  <div key={assignment.assignmentId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface-2)", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                       <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{assignment.judge?.fullName?.charAt(0) || "J"}</div>
                       <div>
                         <h4 style={{ fontWeight: 600, color: "var(--color-text)", fontSize: "0.95rem" }}>{assignment.judge?.fullName}</h4>
                         <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{assignment.judge?.email}</div>
                       </div>
                    </div>
                    <button onClick={() => handleRemoveAssignment(assignment.assignmentId)} className="btn btn-sm" style={{ background: "transparent", color: "var(--color-rose)", border: "1px solid var(--color-rose)" }}>
                       Xóa
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card">
             <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Shield size={18} style={{ color: "var(--color-emerald)" }} /> Danh sách Giám khảo hiện có
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginBottom: "1.5rem" }}>
              Chọn một giám khảo từ hệ thống để phân công họ chấm thi cho vòng thi và hạng mục ở trên.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {judges.length === 0 ? (
                <p style={{ color: "var(--color-text-3)" }}>Không tìm thấy tài khoản nào có vai trò "Giám khảo".</p>
              ) : (
                judges.map((judge: any) => {
                  const isAssigned = currentAssignments.some(a => a.judge?.judgeId === judge.id);
                  return (
                    <div key={judge.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)", opacity: isAssigned ? 0.6 : 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem" }}>{judge.fullName?.charAt(0) || "J"}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{judge.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{judge.email}</div>
                        </div>
                      </div>
                      {!isAssigned ? (
                        <button className="btn btn-secondary btn-sm" onClick={() => handleAssignJudge(judge.id)}>
                          Phân công
                        </button>
                      ) : (
                        <span className="badge badge-success">Đã phân công</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
