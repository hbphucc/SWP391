"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Target, Clock, CheckCircle, AlertCircle, ChevronRight, RefreshCw, CalendarDays } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { App } from "antd";

type SubmissionQueueItem = {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  status: "pending" | "scored" | "locked";
  team: {
    teamId: string;
    teamName: string;
    category: string;
  };
  round: {
    roundId: string;
    roundName: string;
  };
};

type EventDto = {
  eventId: string;
  eventName: string;
  status: string;
  rounds: { roundId: string; roundName: string }[];
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending: <AlertCircle size={14} style={{ color: "#f59e0b" }} />,
  scored:  <Clock size={14} style={{ color: "#06b6d4" }} />,
  locked:  <CheckCircle size={14} style={{ color: "#10b981" }} />,
};

export default function JudgingQueuePage() {
  const { message } = App.useApp();
  const [filter, setFilter] = useState("all");
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [queue, setQueue] = useState<SubmissionQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    try {
      const [queueData, eventData] = await Promise.all([
        apiRequest<SubmissionQueueItem[]>("/submissions/scoring-queue"),
        apiRequest<EventDto[]>("/Events"),
      ]);
      setQueue(queueData);
      setEvents(eventData);
      setSelectedEventId((current) => eventData.some((event) => event.eventId === current) ? current : "");
    } catch (err) {
      setQueue([]);
      message.error(err instanceof Error ? err.message : "Could not load scoring queue.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      void loadQueue();
    };
    void trigger();
  }, [loadQueue]);

  const selectedEvent = events.find((event) => event.eventId === selectedEventId);
  const selectedRoundIds = new Set(selectedEvent?.rounds.map((round) => round.roundId) ?? []);
  const eventQueue = selectedEvent
    ? queue.filter((item) => selectedRoundIds.has(item.round.roundId))
    : [];
  const filtered = eventQueue.filter(q => filter === "all" ? true : q.status === filter);

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="page-title">Scoring & Evaluation</h1>
          <p className="page-subtitle">Select an event to view its scoring queue</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
          <select
            className="form-input"
            style={{ width: 280 }}
            value={selectedEventId}
            onChange={(event) => { setSelectedEventId(event.target.value); setFilter("all"); }}
            disabled={loading || events.length === 0}
            aria-label="Select event"
          >
            <option value="">Select an event...</option>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>{event.eventName} ({event.status})</option>
            ))}
          </select>
          <button className="btn btn-secondary" onClick={loadQueue} disabled={loading}>
            <RefreshCw size={15} style={{ marginRight: 6 }} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Pending",  val: eventQueue.filter(q => q.status === "pending").length, color: "#f59e0b" },
          { label: "In Draft", val: eventQueue.filter(q => q.status === "scored").length,  color: "#06b6d4" },
          { label: "Locked",   val: eventQueue.filter(q => q.status === "locked").length,  color: "#10b981" },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <div style={{ fontSize: "2rem", fontWeight: 800, fontFamily: "var(--font-display)", color: s.color }}>{s.val}</div>
            <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)", fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="tabs" style={{ marginBottom: "1.5rem" }}>
        {["all", "pending", "scored", "locked"].map(f => (
          <button key={f} className={`tab-btn ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          <div className="empty-title">Loading scoring queue...</div>
        </div>
      ) : !selectedEvent ? (
        <div className="empty-state">
          <CalendarDays size={48} className="empty-icon" />
          <div className="empty-title">Select an event</div>
          <div className="empty-desc">Choose an event above to view its submissions and scoring status.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Target size={48} className="empty-icon" />
          <div className="empty-title">No submissions in queue</div>
          <div className="empty-desc">You&apos;re all caught up!</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filtered.map(q => (
            <div key={q.submissionId} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem" }}>
              {STATUS_ICON[q.status]}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{q.team.teamName}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)", marginTop: "0.15rem" }}>
                  {q.team.category} · {q.round.roundName} · Submitted: {new Date(q.submittedAt).toLocaleDateString()}
                </div>
              </div>
              <span className={`badge ${q.status === "pending" ? "badge-warning" : q.status === "locked" ? "badge-success" : "badge-cyan"}`}>
                {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
              </span>
              <Link href={`/admin/judging/${q.submissionId}`}>
                <button className="btn btn-sm btn-primary">
                  {q.status === "locked" ? "View Score" : q.status === "scored" ? "View Draft" : "View Details"} <ChevronRight size={13} />
                </button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
