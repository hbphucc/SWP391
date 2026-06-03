"use client";
import { useState, useEffect } from "react";
import { Calendar, Clock, Save, AlertCircle, Plus, Trash2, Edit2, Play, CheckCircle2 } from "lucide-react";
import { App } from "antd";
import { databaseService } from "@/services/databaseService";

export default function AdminEventsPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | number>("");
  const [isEditing, setIsEditing] = useState(false);
  const [newEventName, setNewEventName] = useState("");

  useEffect(() => {
    const loaded = databaseService.getEvents();
    setEvents(loaded);
    if (loaded.length > 0) setSelectedEventId(loaded[0].id.toString());
  }, []);

  const selectedEvent = events.find(e => e.id.toString() === selectedEventId.toString());

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedEventId(e.target.value);
  };

  const updateRoundDeadline = (roundId: string, newDeadline: string) => {
    if (!selectedEvent) return;
    const updated = {
      ...selectedEvent,
      rounds: selectedEvent.rounds.map((r: any) => r.id === roundId ? { ...r, deadline: newDeadline } : r)
    };
    databaseService.updateEvent(updated);
    setEvents(databaseService.getEvents());
  };

  const handleAddEvent = () => {
    if (!newEventName.trim()) return message.error("Please enter an event name");
    const newEvent = {
      id: `EV-${Date.now()}`,
      name: newEventName,
      status: "Draft",
      rounds: [
        { id: `R-${Date.now()}-1`, name: "Registration Phase", deadline: "", status: "Pending" }
      ]
    };
    databaseService.addEvent(newEvent);
    setEvents(databaseService.getEvents());
    setSelectedEventId(newEvent.id);
    setNewEventName("");
    setIsEditing(false);
    message.success("Event created successfully");
  };

  const handleAddRound = () => {
    if (!selectedEvent) return;
    const newRound = {
      id: `R-${Date.now()}`,
      name: `Round ${selectedEvent.rounds.length + 1}`,
      deadline: "",
      status: "Pending"
    };
    const updated = { ...selectedEvent, rounds: [...selectedEvent.rounds, newRound] };
    databaseService.updateEvent(updated);
    setEvents(databaseService.getEvents());
    message.success("Added new round to event");
  };

  const handleDeleteRound = (roundId: string) => {
    if (!selectedEvent) return;
    const updated = { ...selectedEvent, rounds: selectedEvent.rounds.filter((r:any) => r.id !== roundId) };
    databaseService.updateEvent(updated);
    setEvents(databaseService.getEvents());
    message.success("Round removed");
  };

  const updateRoundStatus = (roundId: string, status: string) => {
    if (!selectedEvent) return;
    const updated = {
      ...selectedEvent,
      rounds: selectedEvent.rounds.map((r: any) => r.id === roundId ? { ...r, status } : r)
    };
    databaseService.updateEvent(updated);
    setEvents(databaseService.getEvents());
  };

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Event & Round Configuration</h1>
          <p className="page-subtitle">Manage hackathon stages, multi-round pipelines, and deadlines</p>
        </div>
        {!isEditing && (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            <Plus size={16} /> Create New Event
          </button>
        )}
      </div>

      {isEditing && (
        <div className="glass-card" style={{ marginBottom: "2rem" }}>
          <h3 style={{ marginBottom: "1rem" }}>Create New Event</h3>
          <div style={{ display: "flex", gap: "1rem" }}>
            <input 
              className="form-input" 
              placeholder="Event Name (e.g. Summer Hackathon 2026)" 
              value={newEventName} 
              onChange={e => setNewEventName(e.target.value)} 
            />
            <button className="btn btn-primary" onClick={handleAddEvent}>Create</button>
            <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {events.length > 0 && selectedEvent && (
        <div className="glass-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Setup Event Pipeline
            </h3>
            <span className={`badge ${selectedEvent.status === 'Active' ? 'badge-success' : 'badge-neutral'}`}>
              {selectedEvent.status || 'Draft'}
            </span>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="form-group">
              <label className="form-label">Select Active Event</label>
              <select className="form-select" value={selectedEventId} onChange={handleEventChange} style={{ cursor: "pointer", fontWeight: "bold" }}>
                {events.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h4 style={{ color: "var(--color-text)" }}>Event Stages / Rounds</h4>
                <button className="btn btn-secondary btn-sm" onClick={handleAddRound}>
                  <Plus size={14} /> Add Round
                </button>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {(selectedEvent.rounds || []).map((round: any, index: number) => (
                  <div key={round.id} style={{ display: "flex", alignItems: "center", gap: "1rem", background: "var(--color-surface-2)", padding: "1.25rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border-2)", transition: "all 0.2s ease" }}>
                    
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(99,102,241,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontWeight: "bold" }}>
                      {index + 1}
                    </div>

                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginBottom: "0.4rem" }}>Round Name</label>
                      <input 
                        className="form-input" 
                        value={round.name} 
                        onChange={(e) => {
                          const updated = {
                            ...selectedEvent,
                            rounds: selectedEvent.rounds.map((r: any) => r.id === round.id ? { ...r, name: e.target.value } : r)
                          };
                          databaseService.updateEvent(updated);
                          setEvents(databaseService.getEvents());
                        }}
                      />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <label className="form-label" style={{ marginBottom: "0.4rem" }}>Submission Deadline</label>
                      <div style={{ position: "relative" }}>
                        <Clock size={16} style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
                        <input 
                          type="datetime-local" 
                          className="form-input" 
                          style={{ paddingLeft: "2.5rem" }} 
                          value={round.deadline}
                          onChange={e => updateRoundDeadline(round.id, e.target.value)}
                        />
                      </div>
                    </div>

                    <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                       <span className={`badge ${round.status === 'Active' ? 'badge-success' : round.status === 'Completed' ? 'badge-primary' : 'badge-warning'}`}>
                         {round.status}
                       </span>
                       <div style={{ display: "flex", gap: "0.5rem" }}>
                         {round.status === 'Pending' && (
                           <button className="btn btn-icon btn-secondary" title="Start Round" onClick={() => updateRoundStatus(round.id, 'Active')}>
                             <Play size={14} className="text-emerald" />
                           </button>
                         )}
                         {round.status === 'Active' && (
                           <button className="btn btn-icon btn-secondary" title="Mark Completed" onClick={() => updateRoundStatus(round.id, 'Completed')}>
                             <CheckCircle2 size={14} className="text-primary" />
                           </button>
                         )}
                         <button className="btn btn-icon btn-danger" style={{ background: "transparent", color: "var(--color-rose)" }} onClick={() => handleDeleteRound(round.id)}>
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--color-text-3)", marginTop: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", padding: "1rem", background: "rgba(245,158,11,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(245,158,11,0.2)" }}>
                <AlertCircle size={16} style={{ color: "var(--color-warning)" }} /> Teams will automatically be locked out of submissions past these deadlines.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
