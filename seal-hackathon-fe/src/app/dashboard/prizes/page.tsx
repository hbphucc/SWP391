"use client";
import { useState, useEffect } from "react";
import { Trophy, Award, Star, Medal, Gift } from "lucide-react";
import { App, Select } from "antd";
import { apiRequest } from "@/lib/api";

type CategoryDto = {
  categoryId: string;
  categoryName: string;
};

type EventDto = {
  eventId: string;
  eventName: string;
  categories?: CategoryDto[];
};

interface PrizeDto {
  prizeId: string;
  eventId: string;
  eventName: string;
  title: string;
  amount?: string | null;
  track?: string | null;
  description?: string | null;
  rank: number;
}

function prizeIcon(rank: number) {
  if (rank <= 1) return <Trophy size={32} style={{ color: "#f59e0b" }} />;
  if (rank === 2) return <Medal size={32} style={{ color: "#94a3b8" }} />;
  if (rank === 3) return <Star size={32} style={{ color: "#10b981" }} />;
  return <Award size={32} style={{ color: "#8b5cf6" }} />;
}

export default function PrizesPage() {
  const { message } = App.useApp();
  const [allPrizes, setAllPrizes] = useState<PrizeDto[]>([]);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pData, eData] = await Promise.all([
          apiRequest<PrizeDto[]>("/Prizes"),
          apiRequest<EventDto[]>("/Events")
        ]);
        setAllPrizes(pData);
        setEvents(eData);
        if (eData.length > 0) {
          setSelectedEventId(eData[0].eventId);
        }
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load data.");
        setAllPrizes([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [message]);

  useEffect(() => {
    setSelectedTrack(null);
  }, [selectedEventId]);

  const displayedPrizes = allPrizes.filter((p) => {
    const matchEvent = selectedEventId ? p.eventId === selectedEventId : true;
    const matchTrack = selectedTrack ? p.track === selectedTrack : true;
    return matchEvent && matchTrack;
  });

  return (
    <div style={{ maxWidth: 1100, height: "calc(100vh - 100px)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Hackathon Prizes</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Rewards and categories for winning teams</p>
        </div>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Select
            style={{ width: 220 }}
            placeholder="Select Event"
            value={selectedEventId || undefined}
            onChange={setSelectedEventId}
            options={events.map((e) => ({ value: e.eventId, label: e.eventName }))}
            allowClear
          />
          <Select
            style={{ width: 180 }}
            placeholder="All Tracks"
            value={selectedTrack || undefined}
            onChange={setSelectedTrack}
            allowClear
            disabled={!selectedEventId}
          >
            <Select.Option value="All Tracks">All Tracks</Select.Option>
            {events.find(e => e.eventId === selectedEventId)?.categories?.map((c) => (
              <Select.Option key={c.categoryId} value={c.categoryName}>{c.categoryName}</Select.Option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><Gift size={48} className="empty-icon" /><div className="empty-title">Loading prizes…</div></div>
      ) : displayedPrizes.length === 0 ? (
        <div className="empty-state"><Gift size={48} className="empty-icon" /><div className="empty-title">No prizes announced yet</div></div>
      ) : (
        <div className="glass-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "1.5rem", overflowY: "auto", flex: 1, paddingRight: "0.5rem", paddingBottom: "2rem" }}>
          {displayedPrizes.map(p => (
            <div key={p.prizeId} className="glass-card" style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", padding: "1.5rem", transition: "transform 0.2s" }} onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ width: 64, height: 64, background: "rgba(255,255,255,0.05)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)" }}>
                {prizeIcon(p.rank)}
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", gap: "1rem" }}>
                  <h3 style={{ fontSize: "1.25rem", margin: 0, color: "var(--color-text-1)" }}>{p.title}</h3>
                  {p.amount && <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-primary)", fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>{p.amount}</span>}
                </div>
                <span className="glass-badge primary" style={{ marginBottom: "0.75rem", display: "inline-block" }}>{p.track || p.eventName}</span>
                <p style={{ fontSize: "0.875rem", color: "var(--color-text-2)", margin: 0, lineHeight: 1.5 }}>{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
