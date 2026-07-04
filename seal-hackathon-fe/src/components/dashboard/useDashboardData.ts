import { useState, useEffect, useMemo } from "react";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { App } from "antd";
import type {
  ActivityItem,
  DashboardMetrics,
  DashboardTeamSummary,
  DeadlineItem,
  InvitationResponse,
  MappedEvent,
} from "@/components/dashboard/dashboardTypes";

function relativeTime(value: string) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface EventRoundDto {
  roundName?: string;
  submissionDeadline?: string | null;
}

interface EventCategoryDto {
  teamCount?: number;
}

interface EventDto {
  eventId: string;
  eventName: string;
  status: string;
  rounds?: EventRoundDto[];
  categories?: EventCategoryDto[];
  endDate: string;
}

interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

export function useDashboardData() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming">("all");
  const [events, setEvents] = useState<MappedEvent[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<InvitationResponse[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [myTeam, setMyTeam] = useState<DashboardTeamSummary | null>(null);
  const [myRegistrations, setMyRegistrations] = useState<string[]>([]);
  const userRoles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const isAdmin = userRoles.includes("Admin");
  const canJudge = isAdmin || userRoles.includes("Judge");
  const isMemberish = userRoles.includes("Member") || userRoles.includes("TeamLeader");
  const currentUserId = user?.id ?? null;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await apiRequest<EventDto[]>("/Events");
        const mappedEvents = data.map((event) => ({
          id: event.eventId,
          name: event.eventName,
          status: event.status === "Ongoing" ? "Active" : event.status,
          currentRound: event.rounds?.[0]?.roundName,
          teamsCount: event.categories?.reduce((sum: number, category: EventCategoryDto) => sum + (category.teamCount ?? 0), 0) ?? 0,
          tracksCount: event.categories?.length ?? 0,
          endDate: event.endDate,
        }));

        setEvents(mappedEvents);
        setMetrics({
          activeEvents: mappedEvents.filter((event) => event.status === "Active").length,
          totalEvents: mappedEvents.length,
          totalTeams: mappedEvents.reduce((sum, event) => sum + event.teamsCount, 0),
          totalTracks: mappedEvents.reduce((sum, event) => sum + event.tracksCount, 0),
          upcomingEvent: mappedEvents[0]?.name ?? "SEAL Hackathon",
        });

        // Derive upcoming deadlines from event round submission deadlines
        const now = Date.now();
        const upcoming: DeadlineItem[] = data
          .flatMap((event) =>
            (event.rounds ?? [])
              .filter((r) => r.submissionDeadline)
              .map((r) => ({
                event: event.eventName,
                task: `${r.roundName ?? "Round"} – Submission Deadline`,
                rawDate: new Date(r.submissionDeadline as string),
              })),
          )
          .filter((d) => !Number.isNaN(d.rawDate.getTime()) && d.rawDate.getTime() >= now)
          .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
          .slice(0, 5)
          .map((d) => ({
            event: d.event,
            task: d.task,
            date: d.rawDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            urgent: d.rawDate.getTime() - now < 1000 * 60 * 60 * 24 * 7,
          }));
        setDeadlines(upcoming);
      } catch (err) {
        message.error(err instanceof Error ? err.message : "Could not load dashboard data.");
        setEvents([]);
        setMetrics({
          activeEvents: 0,
          totalEvents: 0,
          totalTeams: 0,
          totalTracks: 0,
          upcomingEvent: "SEAL Hackathon",
        });
      }
    };

    const loadActivity = async () => {
      try {
        const notifications = await apiRequest<NotificationDto[]>("/notifications");
        setActivities(
          notifications.slice(0, 6).map((n) => ({
            title: n.title,
            message: n.message,
            time: relativeTime(n.createdAt),
            type: n.type,
          })),
        );
      } catch {
        setActivities([]);
      }
    };

    const loadInvitations = async () => {
      try {
        const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
        setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
      } catch {
        setReceivedInvites([]);
      }
    };

    const loadMyTeam = async () => {
      try {
        const team = await apiRequest<DashboardTeamSummary>("/teams/my-team");
        setMyTeam(team);
      } catch {
        setMyTeam(null);
      }
    };

    const loadRegistrations = async () => {
      if (userRoles.includes("Mentor") || userRoles.includes("Judge")) {
        try {
          const regs = await apiRequest<string[]>("/Events/my-registrations");
          setMyRegistrations(regs);
        } catch {
          setMyRegistrations([]);
        }
      }
    };

    loadDashboard();
    loadActivity();
    loadInvitations();
    loadMyTeam();
    loadRegistrations();
  }, [message, userRoles]);

  const filteredEvents = useMemo(() => {
    return events.filter(e =>
      activeTab === "all" ? true : e.status.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab, events]);

  const handleAcceptInvite = async (id: string, teamName: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/accept`, { method: "POST" });
      message.success(`You have successfully joined team ${teamName}!`);
      window.location.reload();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to accept invitation.");
    }
  };

  const handleDeclineInvite = async (id: string) => {
    try {
      await apiRequest(`/teams/invitations/${id}/reject`, { method: "POST" });
      message.success("Invitation declined.");
      const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
      setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to decline invitation.");
    }
  };

  const handleRegisterEvent = async (eventId: string, role: string) => {
    try {
      await apiRequest(`/Events/${eventId}/register?role=${role}`, { method: "POST" });
      message.success(`Successfully registered as ${role}!`);
      setMyRegistrations(prev => [...prev, eventId]);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to register for event.");
    }
  };

  return {
    activeTab, setActiveTab,
    events, filteredEvents,
    receivedInvites,
    metrics,
    activities,
    deadlines,
    myTeam,
    myRegistrations,
    userRoles, isAdmin, canJudge, isMemberish, currentUserId,
    handleAcceptInvite, handleDeclineInvite, handleRegisterEvent,
  };
}
