import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "active" | "upcoming">("all");
  const userRoles = useMemo(() => user?.roles ?? [], [user?.roles]);
  const isAdmin = userRoles.includes("Admin");
  const canJudge = isAdmin || userRoles.includes("Judge");
  const isMemberish = userRoles.includes("Member") || userRoles.includes("TeamLeader");
  const currentUserId = user?.id ?? null;
  const isMentorOrJudge = userRoles.includes("Mentor") || userRoles.includes("Judge");

  const { data: rawEvents = [], isLoading, error: eventsError } = useQuery({
    queryKey: ["events"],
    queryFn: () => apiRequest<EventDto[]>("/Events"),
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiRequest<NotificationDto[]>("/notifications"),
  });
  const { data: rawInvites = [] } = useQuery({
    queryKey: ["team-invitations-received"],
    queryFn: () => apiRequest<InvitationResponse[]>("/teams/invitations/received"),
  });
  // "No team" is an expected 404 — don't retry it; the null is meaningful.
  const { data: myTeam = null } = useQuery({
    queryKey: ["my-team"],
    queryFn: () => apiRequest<DashboardTeamSummary>("/teams/my-team"),
    retry: false,
  });
  const { data: myRegistrations = [] } = useQuery({
    queryKey: ["my-registrations"],
    queryFn: () => apiRequest<string[]>("/Events/my-registrations"),
    enabled: isMentorOrJudge,
  });

  useEffect(() => {
    if (eventsError) message.error(eventsError instanceof Error ? eventsError.message : "Could not load dashboard data.");
  }, [eventsError, message]);

  const events = useMemo<MappedEvent[]>(
    () =>
      rawEvents.map((event) => ({
        id: event.eventId,
        name: event.eventName,
        status: event.status === "Ongoing" ? "Active" : event.status,
        currentRound: event.rounds?.[0]?.roundName,
        teamsCount: event.categories?.reduce((sum: number, category: EventCategoryDto) => sum + (category.teamCount ?? 0), 0) ?? 0,
        tracksCount: event.categories?.length ?? 0,
        endDate: event.endDate,
      })),
    [rawEvents],
  );

  // Keep the previous "null while first loading" shape so stat tiles can skeleton.
  const metrics = useMemo<DashboardMetrics | null>(() => {
    if (isLoading) return null;
    return {
      activeEvents: events.filter((event) => event.status === "Active").length,
      totalEvents: events.length,
      totalTeams: events.reduce((sum, event) => sum + event.teamsCount, 0),
      totalTracks: events.reduce((sum, event) => sum + event.tracksCount, 0),
      upcomingEvent: events[0]?.name ?? "SEAL Hackathon",
    };
  }, [events, isLoading]);

  const deadlines = useMemo<DeadlineItem[]>(() => {
    // Deadlines are inherently relative to "now"; recomputing per render is fine
    // and cheap (only when events change), so the impurity here is intentional.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return rawEvents
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
  }, [rawEvents]);

  const activities = useMemo<ActivityItem[]>(
    () =>
      notifications.slice(0, 6).map((n) => ({
        title: n.title,
        message: n.message,
        time: relativeTime(n.createdAt),
        type: n.type,
      })),
    [notifications],
  );

  const receivedInvites = useMemo(
    () => rawInvites.filter((inv) => inv.status === "Pending"),
    [rawInvites],
  );

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
      await queryClient.invalidateQueries({ queryKey: ["team-invitations-received"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to decline invitation.");
    }
  };

  const handleRegisterEvent = async (eventId: string, role: string) => {
    try {
      await apiRequest(`/Events/${eventId}/register?role=${role}`, { method: "POST" });
      message.success(`Successfully registered as ${role}!`);
      queryClient.setQueryData<string[]>(["my-registrations"], (prev) => [...(prev ?? []), eventId]);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to register for event.");
    }
  };

  return {
    activeTab, setActiveTab,
    events, filteredEvents,
    isLoading,
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
