"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Bot, Globe, Smartphone, Shield, Lightbulb, Search, RefreshCw } from "lucide-react";
import { App, Input } from "antd";
import { apiRequest } from "@/lib/api";
import PageHeader from "@/components/workspace/PageHeader";
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
  const [eventId, setEventId] = useState("");
  const [searchText, setSearchText] = useState("");

  const {
    data: events = [],
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiRequest<EventDto[]>("/Events"),
  });

  // Default to the first event once events load, while nothing is selected yet.
  useEffect(() => {
    if (!eventId && events.length > 0) setEventId(events[0].eventId);
  }, [events, eventId]);

  const {
    data: tracks = [],
    isLoading: tracksLoading,
    error: tracksError,
    refetch: refetchTracks,
  } = useQuery({
    queryKey: ["event-categories", eventId],
    queryFn: () => apiRequest<CategoryDto[]>(`/events/${eventId}/categories`),
    enabled: !!eventId,
  });

  useEffect(() => {
    if (eventsError) message.error(eventsError instanceof Error ? eventsError.message : "Could not load events.");
  }, [eventsError, message]);
  useEffect(() => {
    if (tracksError) message.error(tracksError instanceof Error ? tracksError.message : "Could not load categories.");
  }, [tracksError, message]);

  const loading = eventsLoading || (!!eventId && tracksLoading);

  const getIcon = (name: string) => {
    if (!name) return <Lightbulb size={24} style={{ color: "var(--color-amber)" }} />;
    if (name.toLowerCase().includes("ai") || name.toLowerCase().includes("bot")) return <Bot size={24} style={{ color: "var(--color-emerald)" }} />;
    if (name.toLowerCase().includes("web") || name.toLowerCase().includes("globe")) return <Globe size={24} style={{ color: "#3b82f6" }} />;
    if (name.toLowerCase().includes("mobile") || name.toLowerCase().includes("app")) return <Smartphone size={24} style={{ color: "var(--color-violet)" }} />;
    if (name.toLowerCase().includes("security") || name.toLowerCase().includes("shield")) return <Shield size={24} style={{ color: "#ef4444" }} />;
    return <Lightbulb size={24} style={{ color: "var(--color-amber)" }} />;
  };

  const filteredTracks = tracks.filter(t =>
    t.categoryName?.toLowerCase().includes(searchText.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Competition Tracks"
        subtitle="Browse event tracks and find the category that best matches your team."
        actions={
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
          <button className="btn btn-secondary btn-icon" onClick={() => { refetchEvents(); refetchTracks(); }} disabled={loading}>
            <RefreshCw size={15} />
          </button>
        </div>
        }
      />

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
