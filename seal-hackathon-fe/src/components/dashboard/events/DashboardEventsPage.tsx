"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { App } from "antd";
import { BadgeCheck, CalendarDays, Clock, Eye, Search, Sparkles, Users } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import PageHeader from "@/components/workspace/PageHeader";
import styles from "./DashboardEventsPage.module.css";

type EventDto = {
  eventId: string;
  eventName: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  rounds?: unknown[];
};

const statusOptions = ["All", "Published", "Ongoing", "Upcoming", "Completed", "Draft"];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function getStatusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "ongoing" || normalized === "active") return styles.statusOngoing;
  if (normalized === "published" || normalized === "upcoming") return styles.statusPublished;
  if (normalized === "completed") return styles.statusCompleted;
  return styles.statusNeutral;
}

export default function UserEventsPage() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [events, setEvents] = useState<EventDto[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const userRoles = React.useMemo(() => user?.roles ?? [], [user?.roles]);

  useEffect(() => {
    let active = true;

    apiRequest<EventDto[]>("/Events")
      .then((data) => {
        if (!active) return;
        setEvents(data);
      })
      .catch((err) => {
        if (!active) return;
        message.error(err instanceof Error ? err.message : "Could not load events.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (userRoles.includes("Mentor") || userRoles.includes("Judge")) {
      apiRequest<string[]>("/Events/my-registrations")
        .then((data) => {
          if (!active) return;
          setMyRegistrations(data);
        })
        .catch(() => {
          if (!active) return;
          setMyRegistrations([]);
        });
    }

    return () => {
      active = false;
    };
  }, [message, userRoles]);

  const handleRegisterEvent = async (eventId: string, role: string) => {
    try {
      await apiRequest(`/Events/${eventId}/register?role=${role}`, { method: "POST" });
      message.success(`Successfully registered as ${role}!`);
      setMyRegistrations((prev) => Array.from(new Set([...prev, eventId])));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to register for event.");
    }
  };

  const filteredEvents = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return events.filter((event) => {
      const matchesStatus = statusFilter === "All" || event.status === statusFilter;
      const matchesSearch =
        !query ||
        event.eventName.toLowerCase().includes(query) ||
        event.status.toLowerCase().includes(query) ||
        (event.description ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [events, searchText, statusFilter]);

  return (
    <div>
      <PageHeader
        title="Discover Hackathons"
        subtitle="Explore event timelines, rounds, and participation options from one place."
        actions={
          <div className={styles.headerActions}>
            <div className={styles.searchBox}>
              <Search size={16} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search events..."
                aria-label="Search events"
              />
            </div>
            <select className={`form-input ${styles.statusSelect}`} value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              {statusOptions.map((status) => (
                <option key={status} value={status}>{status} events</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="empty-state">
          <span className="spinner" />
          <div className="empty-title">Loading events</div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty-state">
          <CalendarDays size={42} className="empty-icon" />
          <div className="empty-title">No events found</div>
          <div className="empty-desc">Try a different search or status filter.</div>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredEvents.map((event) => {
            const isRegistered = myRegistrations.includes(event.eventId);
            const canRegister =
              ["Draft", "Published", "Ongoing", "Upcoming", "Active"].includes(event.status) &&
              !isRegistered;

            return (
              <article key={event.eventId} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={`${styles.statusBadge} ${getStatusClass(event.status)}`}>{event.status}</span>
                  {isRegistered && (
                    <span className={styles.registeredBadge}>
                      <BadgeCheck size={13} /> Registered
                    </span>
                  )}
                </div>

                <div className={styles.iconWrap}>
                  <Sparkles size={20} />
                </div>

                <h3 className={styles.title}>{event.eventName}</h3>
                <p className={styles.description}>
                  {event.description?.trim() || "Open this event to view details, rounds, team options, and participation actions."}
                </p>

                <div className={styles.metaGrid}>
                  <div>
                    <CalendarDays size={15} />
                    <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                  </div>
                  <div>
                    <Clock size={15} />
                    <span>{event.rounds?.length ?? 0} rounds</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <Link href={`/dashboard/events/${event.eventId}`} className="btn btn-primary">
                    <Eye size={15} /> View Details
                  </Link>
                  {canRegister && userRoles.includes("Mentor") && (
                    <button className="btn btn-secondary" onClick={() => handleRegisterEvent(event.eventId, "Mentor")}>
                      <Users size={15} /> Mentor
                    </button>
                  )}
                  {canRegister && userRoles.includes("Judge") && (
                    <button className="btn btn-secondary" onClick={() => handleRegisterEvent(event.eventId, "Judge")}>
                      <Users size={15} /> Judge
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
