"use client";
import { useState, useEffect } from "react";
import { FileText, Plus, Trash2, Edit2, Copy, Save, AlertCircle } from "lucide-react";
import { App, Modal, Tag, Space } from "antd";

import { apiRequest } from "@/lib/api";

export default function CriteriaPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [criteria, setCriteria] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editItem, setEditItem] = useState<any>(null); // null if adding new

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await apiRequest<any[]>("/Events");
      setEvents(data);
      if (data.length > 0) {
        setSelectedEventId(data[0].eventId);
      }
    } catch (err) {
      message.error("Failed to load events.");
    }
  };

  const selectedEvent = events.find(e => e.eventId === selectedEventId);

  useEffect(() => {
    if (selectedEvent && selectedEvent.rounds && selectedEvent.rounds.length > 0) {
      setSelectedRoundId(selectedEvent.rounds[0].roundId);
    } else {
      setSelectedRoundId("");
      setCriteria([]);
    }
  }, [selectedEventId, events]);

  useEffect(() => {
    if (selectedRoundId) {
      loadCriteria();
    }
  }, [selectedRoundId]);

  const loadCriteria = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<any[]>(`/rounds/${selectedRoundId}/criteria`);
      setCriteria(data);
    } catch (err) {
      message.error("Failed to load criteria.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    if (!selectedRoundId) return message.warning("Please select a round first.");
    setEditItem({
      criteriaName: "",
      maxScore: 10,
      weight: 10
    });
    setIsEditing(true);
  };

  const handleEdit = (item: any) => {
    setEditItem({ ...item });
    setIsEditing(true);
  };

  const handleDelete = (criteriaId: string) => {
    Modal.confirm({
      title: "Delete Criterion?",
      onOk: async () => {
        try {
          await apiRequest(`/rounds/${selectedRoundId}/criteria/${criteriaId}`, { method: "DELETE" });
          message.success("Deleted successfully.");
          loadCriteria();
        } catch (err: any) {
          message.error(err.message || "Failed to delete.");
        }
      }
    });
  };

  const handleSave = async () => {
    if (!editItem.criteriaName.trim()) return message.error("Vui lòng nhập tên tiêu chí.");
    if (editItem.maxScore <= 0) return message.error("Điểm tối đa phải lớn hơn 0.");
    if (editItem.weight <= 0) return message.error("Trọng số phải lớn hơn 0.");
    
    // Kiểm tra tổng trọng số không được vượt quá 100%
    const currentTotal = criteria
      .filter(c => c.criteriaId !== editItem.criteriaId)
      .reduce((sum, c) => sum + c.weight, 0);
      
    if (currentTotal + editItem.weight > 100) {
      return message.error(`Tổng trọng số không được vượt quá 100%. Các tiêu chí hiện tại đã chiếm ${currentTotal}%.`);
    }

    try {
      if (editItem.criteriaId) {
        // Update
        await apiRequest(`/rounds/${selectedRoundId}/criteria/${editItem.criteriaId}`, {
          method: "PUT",
          body: JSON.stringify(editItem)
        });
      } else {
        // Create
        await apiRequest(`/rounds/${selectedRoundId}/criteria`, {
          method: "POST",
          body: JSON.stringify(editItem)
        });
      }
      message.success("Đã lưu thành công.");
      setIsEditing(false);
      loadCriteria();
    } catch (err: any) {
      message.error(err.message || "Thao tác thất bại.");
    }
  };

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div style={{ maxWidth: 1000 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={28} /> Tiêu chí chấm điểm
          </h1>
          <p className="page-subtitle">Quản lý bộ tiêu chí chấm điểm được chỉ định cho từng vòng thi.</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={handleAddNew}>
            <Plus size={16} /> Thêm tiêu chí
          </button>
        )}
      </div>

      {!isEditing && (
        <div className="glass-card" style={{ marginBottom: "1rem", display: "flex", gap: "1rem" }}>
          <div style={{ flex: 1 }}>
            <label className="form-label">Sự kiện</label>
            <select className="form-select" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
              {events.map(e => <option key={e.eventId} value={e.eventId}>{e.eventName}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label className="form-label">Vòng thi</label>
            <select className="form-select" value={selectedRoundId} onChange={e => setSelectedRoundId(e.target.value)}>
              {selectedEvent?.rounds?.map((r: any) => <option key={r.roundId} value={r.roundId}>{r.roundName}</option>)}
            </select>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="glass-card" style={{ animation: "modal-in 0.3s ease" }}>
          <h3 style={{ marginBottom: "1.5rem" }}>{editItem.criteriaId ? "Chỉnh sửa Tiêu chí" : "Thêm Tiêu chí Mới"}</h3>
          
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Tên Tiêu chí</label>
            {!editItem.criteriaId && (
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-3)', display: 'block', marginBottom: 8 }}>Gợi ý:</span>
                <Space size={[0, 8]} wrap>
                  {["Tính sáng tạo", "Đổi mới & Đột phá", "Tính khả thi", "Giao diện UI/UX", "Độ khó Kỹ thuật", "Kỹ năng Thuyết trình"].map(crit => (
                    <Tag 
                      key={crit} 
                      style={{ cursor: 'pointer', background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text-2)' }}
                      onClick={() => setEditItem({...editItem, criteriaName: crit})}
                    >
                      {crit}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
            <input 
              className="form-input" 
              placeholder="VD: Tính Đổi mới" 
              value={editItem.criteriaName}
              onChange={(e) => setEditItem({...editItem, criteriaName: e.target.value})}
            />
          </div>
          <div className="form-group" style={{ marginBottom: "1rem" }}>
            <label className="form-label">Điểm tối đa</label>
            <input 
              className="form-input" 
              type="number"
              value={editItem.maxScore}
              onChange={(e) => setEditItem({...editItem, maxScore: Number(e.target.value)})}
            />
          </div>
          <div className="form-group" style={{ marginBottom: "1.5rem" }}>
            <label className="form-label">Trọng số (%)</label>
            <input 
              className="form-input" 
              type="number"
              value={editItem.weight}
              onChange={(e) => setEditItem({...editItem, weight: Number(e.target.value)})}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Hủy bỏ</button>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={16} /> Lưu lại
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h4 style={{ color: "var(--color-text)" }}>Danh sách Tiêu chí</h4>
            <span className={`badge ${totalWeight === 100 ? 'badge-success' : 'badge-danger'}`}>
              Tổng Trọng số: {totalWeight}%
            </span>
          </div>

          <table className="table" style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "1rem" }}>Tên Tiêu chí</th>
                <th style={{ padding: "1rem" }}>Điểm tối đa</th>
                <th style={{ padding: "1rem" }}>Trọng số (%)</th>
                <th style={{ padding: "1rem", textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center" }}>Đang tải...</td></tr>
              ) : criteria.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-3)" }}>Chưa có tiêu chí nào cho vòng thi này.</td></tr>
              ) : criteria.map(c => (
                <tr key={c.criteriaId} style={{ borderBottom: "1px solid var(--color-border-1)" }}>
                  <td style={{ padding: "1rem", fontWeight: "bold" }}>{c.criteriaName}</td>
                  <td style={{ padding: "1rem" }}>{c.maxScore} pts</td>
                  <td style={{ padding: "1rem" }}>{c.weight}%</td>
                  <td style={{ padding: "1rem", textAlign: "right" }}>
                    <button className="btn btn-icon btn-secondary" style={{ marginRight: 8 }} onClick={() => handleEdit(c)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn btn-icon btn-danger" style={{ background: "transparent", color: "var(--color-rose)" }} onClick={() => handleDelete(c.criteriaId)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
