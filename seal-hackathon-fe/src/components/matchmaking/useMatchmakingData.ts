import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { apiRequest, fetchCurrentUser } from "@/lib/api";

export interface UserData {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
}

export interface TeamMemberData {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  role: string;
}

export interface TeamData {
  teamId: string;
  teamName: string;
  status: string;
  leaderId: string;
  category: {
    categoryId: string;
    categoryName: string;
  };
  members: TeamMemberData[];
}

export interface FreeAgentOrSuggestion {
  id: string;
  name: string;
  email: string;
  studentCode?: string | null;
  schoolName?: string | null;
  studentType?: string;
  role: string;
  skills: string[];
  xp: number;
  matchPercentage?: number;
  matchReasons?: string[];
}

export interface InvitationResponse {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviterUserName: string;
  inviteeUserId: string;
  inviteeUserName: string;
  inviteeUserEmail: string;
  status: string;
  message?: string | null;
  createdAt: string;
  respondedAt?: string | null;
}

export interface RecruitingTeam {
  teamId: string;
  teamName: string;
  categoryName: string;
  leaderName: string;
  memberCount: number;
  members: string[];
  hasPendingRequest: boolean;
}

export function useMatchmakingData() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"suggestions" | "sent" | "received">("suggestions");
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  // Debounce the search/skill inputs before they feed the suggestions query key,
  // so typing doesn't fire one request per keystroke (react-query keeps the
  // latest key's result, which also replaces the old out-of-order seq guard).
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [debouncedSkill, setDebouncedSkill] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setDebouncedSkill(skillFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, skillFilter]);

  // `busyAction` prevents duplicate requests from double-clicks.
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const currentUserQuery = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });
  const currentUser = currentUserQuery.data ?? null;

  // "No team" is an expected 404 — don't retry it.
  const myTeamQuery = useQuery({
    queryKey: ["my-team"],
    queryFn: () => apiRequest<TeamData>("/teams/my-team"),
    retry: false,
  });
  const myTeam = myTeamQuery.data ?? null;

  const loading = currentUserQuery.isLoading || myTeamQuery.isLoading;

  const suggestionsQuery = useQuery({
    queryKey: ["matchmaking-suggestions", debouncedSearch, debouncedSkill],
    queryFn: () =>
      debouncedSearch || debouncedSkill
        ? apiRequest<FreeAgentOrSuggestion[]>(
            `/users/free-agents?search=${encodeURIComponent(debouncedSearch)}&role=${encodeURIComponent(debouncedSkill)}`,
          )
        : apiRequest<FreeAgentOrSuggestion[]>("/matchmaking/suggestions"),
    enabled: activeTab === "suggestions" && !!myTeam,
  });
  const suggestions = suggestionsQuery.data ?? [];
  const loadingSuggestions = suggestionsQuery.isFetching;

  const recruitingQuery = useQuery({
    queryKey: ["teams-recruiting"],
    queryFn: () => apiRequest<RecruitingTeam[]>("/teams/recruiting"),
    enabled: activeTab === "suggestions" && !myTeam,
  });
  const recruitingTeams = recruitingQuery.data ?? [];
  const loadingRecruiting = recruitingQuery.isFetching;

  const sentQuery = useQuery({
    queryKey: ["team-invitations-sent"],
    queryFn: () => apiRequest<InvitationResponse[]>("/teams/invitations/sent"),
    enabled: activeTab === "sent",
  });
  const sentInvites = sentQuery.data ?? [];
  const loadingSent = sentQuery.isFetching;

  const receivedQuery = useQuery({
    queryKey: ["team-invitations-received-all"],
    queryFn: () => apiRequest<InvitationResponse[]>("/teams/invitations/received"),
    enabled: activeTab === "received",
  });
  const receivedInvites = receivedQuery.data ?? [];
  const loadingReceived = receivedQuery.isFetching;

  // Surface load failures as toasts (matching the previous per-load behavior).
  useEffect(() => {
    if (currentUserQuery.error) message.error("Could not load your account information.");
  }, [currentUserQuery.error, message]);
  useEffect(() => {
    if (suggestionsQuery.error) message.error("Could not load candidate list.");
  }, [suggestionsQuery.error, message]);
  useEffect(() => {
    if (recruitingQuery.error) message.error("Could not load recruiting teams list.");
  }, [recruitingQuery.error, message]);
  useEffect(() => {
    if (sentQuery.error) message.error("Could not load sent invitations.");
  }, [sentQuery.error, message]);
  useEffect(() => {
    if (receivedQuery.error) message.error("Could not load received invitations.");
  }, [receivedQuery.error, message]);

  const handleRequestToJoin = async (teamId: string, teamName: string) => {
    try {
      await apiRequest(`/teams/${teamId}/join-request`, { method: "POST" });
      message.success(`Join request sent to team ${teamName}!`);
      void queryClient.invalidateQueries({ queryKey: ["teams-recruiting"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to send join request.");
    }
  };

  const handleInvite = async (targetUser: FreeAgentOrSuggestion) => {
    if (busyAction) return;
    if (!myTeam) {
      message.error("You don't have a team yet. Please create a team before inviting members.");
      return;
    }
    if (myTeam.leaderId !== currentUser?.id) {
      message.error("Only the Team Leader can send invitations.");
      return;
    }
    if (myTeam.status !== "Pending") {
      message.error("Your team has been approved and cannot add more members.");
      return;
    }
    if (myTeam.members.length >= 5) {
      message.warning("Your team has reached the maximum of 5 members.");
      return;
    }

    setBusyAction(`invite-${targetUser.id}`);
    try {
      await apiRequest("/teams/invitations", {
        method: "POST",
        body: JSON.stringify({
          inviteeUserId: targetUser.id,
          message: `Hi ${targetUser.name}, we'd love to have you join our team and work on this project together!`
        })
      });
      message.success(`Invitation sent successfully to ${targetUser.name}!`);
      void queryClient.invalidateQueries({ queryKey: ["matchmaking-suggestions"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to send invitation.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (busyAction) return;
    setBusyAction(`cancel-${id}`);
    try {
      await apiRequest(`/teams/invitations/${id}/cancel`, { method: "POST" });
      message.success("Invitation cancelled.");
      void queryClient.invalidateQueries({ queryKey: ["team-invitations-sent"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to cancel invitation.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleAcceptInvite = async (id: string) => {
    if (busyAction) return;
    setBusyAction(`accept-${id}`);
    try {
      await apiRequest(`/teams/invitations/${id}/accept`, { method: "POST" });
      message.success("You have successfully joined the team!");
      await queryClient.invalidateQueries({ queryKey: ["my-team"] });
      void queryClient.invalidateQueries({ queryKey: ["team-invitations-received-all"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to join team.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleRejectInvite = async (id: string) => {
    if (busyAction) return;
    setBusyAction(`reject-${id}`);
    try {
      await apiRequest(`/teams/invitations/${id}/reject`, { method: "POST" });
      message.success("Invitation declined.");
      void queryClient.invalidateQueries({ queryKey: ["team-invitations-received-all"] });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to decline invitation.");
    } finally {
      setBusyAction(null);
    }
  };

  return {
    currentUser, myTeam, loading,
    activeTab, setActiveTab,
    recruitingTeams, loadingRecruiting,
    suggestions, loadingSuggestions, searchQuery, setSearchQuery, skillFilter, setSkillFilter,
    sentInvites, loadingSent,
    receivedInvites, loadingReceived,
    busyAction,
    handleRequestToJoin, handleInvite, handleCancelInvite, handleAcceptInvite, handleRejectInvite,
  };
}
