"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { Users, Bot, Globe, Smartphone, Shield, Lightbulb, Search, RefreshCw } from "lucide-react";
import { App, Input } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./UserTracksPage.module.css";

type EventDto = {
  eventId: string;
  eventName: string;
};

type CategoryDto = {
  categoryId: string;
  categoryName: string;
  description?: string | null;
};

export default function UserTracksPage() {
  const { message } = App.useApp();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [eventId, setEventId] = useState("");
  const [tracks, setTracks] = useState<CategoryDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<EventDto[]>("/Events");
      setEvents(data);
      setEventId((current) => current || data[0]?.eventId || "");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load events.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    let active = true;
    setLoading(true);
    apiRequest<CategoryDto[]>(`/events/${eventId}/categories`)
      .then((data) => {
        if (active) setTracks(data);
      })
      .catch((err) => {
        if (active) message.error(err instanceof Error ? err.message : "Could not load categories.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [eventId, message]);

  const getIcon = (name: string) => {
    if (!name) return <Lightbulb size={24} style={{ color: "#f59e0b" }} />;
    if (name.toLowerCase().includes("ai") || name.toLowerCase().includes("bot")) return <Bot size={24} style={{ color: "#10b981" }} />;
    if (name.toLowerCase().includes("web") || name.toLowerCase().includes("globe")) return <Globe size={24} style={{ color: "#3b82f6" }} />;
    if (name.toLowerCase().includes("mobile") || name.toLowerCase().includes("app")) return <Smartphone size={24} style={{ color: "#8b5cf6" }} />;
    if (name.toLowerCase().includes("security") || name.toLowerCase().includes("shield")) return <Shield size={24} style={{ color: "#ef4444" }} />;
    return <Lightbulb size={24} style={{ color: "#f59e0b" }} />;
  };

  const filteredTracks = tracks.filter(t =>
    t.categoryName?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className={`page-header ${styles.header}`}>
        <div>
          <h1 className="page-title">Competition Tracks</h1>
        </div>
        <div className={styles.toolbar}>
          <select className={`form-input ${styles.eventSelect}`} value={eventId} onChange={(event) => setEventId(event.target.value)} disabled={events.length === 0}>
            {events.map((event) => (
              <option key={event.eventId} value={event.eventId}>{event.eventName}</option>
            ))}
          </select>
          <Input
            placeholder="Search tracks..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className={styles.searchInput}
            prefix={<Search size={16} />}
          />
          <button className="btn btn-secondary btn-icon" onClick={loadEvents} disabled={loading}>
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          <div className="empty-title">Loading tracks</div>
        </div>
      ) : (
        <div className="grid-3">
          {filteredTracks.map(t => (
            <div key={t.categoryId} className={`glass-card ${styles.trackCard}`}>
              <div className={styles.trackHeader}>
                <div className={styles.trackIconBox}>
                  {getIcon(t.categoryName)}
                </div>
                <div>
                  <h3 className={styles.trackTitle}>{t.categoryName}</h3>
                  <span className={`badge badge-primary ${styles.categoryBadge}`}>Category</span>
                </div>
              </div>
              
              <p className={styles.description}>
                {t.description || "No description provided for this track."}
              </p>

              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <Users size={15} className={styles.blueIcon} /> Teams are tracked by backend event/category data.
                </div>
              </div>
            </div>
          ))}
          {filteredTracks.length === 0 && (
            <div className={styles.empty}>
              No tracks found for this event.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
