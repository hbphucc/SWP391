import { useState, useEffect, useCallback, useRef } from "react";
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
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [myTeam, setMyTeam] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"suggestions" | "sent" | "received">("suggestions");

  const [recruitingTeams, setRecruitingTeams] = useState<RecruitingTeam[]>([]);
  const [loadingRecruiting, setLoadingRecruiting] = useState(false);

  // Tab 1: Suggestions / Free Agents
  const [suggestions, setSuggestions] = useState<FreeAgentOrSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState("");

  // Tab 2: Sent Invitations
  const [sentInvites, setSentInvites] = useState<InvitationResponse[]>([]);
  const [loadingSent, setLoadingSent] = useState(false);

  // Tab 3: Received Invitations
  const [receivedInvites, setReceivedInvites] = useState<InvitationResponse[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(false);

  // Guards: `busyAction` prevents duplicate requests from double-clicks;
  // `suggestionsSeqRef` discards out-of-order search responses.
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const suggestionsSeqRef = useRef(0);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);

      try {
        const teamData = await apiRequest<TeamData>("/teams/my-team");
        setMyTeam(teamData);
      } catch {
        setMyTeam(null);
      }
    } catch {
      message.error("Could not load your account information.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      void loadInitialData();
    };
    void trigger();
  }, [loadInitialData]);

  const loadSuggestionsOrAgents = useCallback(async () => {
    const seq = ++suggestionsSeqRef.current;
    setLoadingSuggestions(true);
    try {
      const data = searchQuery || skillFilter
        ? await apiRequest<FreeAgentOrSuggestion[]>(
            `/users/free-agents?search=${encodeURIComponent(searchQuery)}&role=${encodeURIComponent(skillFilter)}`
          )
        : await apiRequest<FreeAgentOrSuggestion[]>("/matchmaking/suggestions");

      // A newer search has started since this one — drop the stale result.
      if (seq !== suggestionsSeqRef.current) return;
      setSuggestions(data);
    } catch {
      if (seq === suggestionsSeqRef.current) {
        message.error("Could not load candidate list.");
      }
    } finally {
      if (seq === suggestionsSeqRef.current) {
        setLoadingSuggestions(false);
      }
    }
  }, [searchQuery, skillFilter, message]);

  const loadSentInvites = useCallback(async () => {
    setLoadingSent(true);
    try {
      const data = await apiRequest<InvitationResponse[]>("/teams/invitations/sent");
      setSentInvites(data);
    } catch {
      message.error("Could not load sent invitations.");
    } finally {
      setLoadingSent(false);
    }
  }, [message]);

  const loadRecruitingTeams = useCallback(async () => {
    setLoadingRecruiting(true);
    try {
      const data = await apiRequest<RecruitingTeam[]>("/teams/recruiting");
      setRecruitingTeams(data);
    } catch {
      message.error("Could not load recruiting teams list.");
    } finally {
      setLoadingRecruiting(false);
    }
  }, [message]);

  const handleRequestToJoin = async (teamId: string, teamName: string) => {
    try {
      await apiRequest(`/teams/${teamId}/join-request`, { method: "POST" });
      message.success(`Join request sent to team ${teamName}!`);
      void loadRecruitingTeams();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to send join request.");
    }
  };

  const loadReceivedInvites = useCallback(async () => {
    setLoadingReceived(true);
    try {
      const data = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
      setReceivedInvites(data);
    } catch {
      message.error("Could not load received invitations.");
    } finally {
      setLoadingReceived(false);
    }
  }, [message]);

  // Debounce the suggestions/search load so typing doesn't fire one API
  // request per keystroke.
  useEffect(() => {
    if (activeTab !== "suggestions") return;
    const timer = setTimeout(() => {
      void loadSuggestionsOrAgents();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, loadSuggestionsOrAgents]);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      if (activeTab === "suggestions") {
        if (myTeam) {
          void loadSuggestionsOrAgents();
        } else {
          void loadRecruitingTeams();
        }
      } else if (activeTab === "sent") {
        void loadSentInvites();
      } else if (activeTab === "received") {
        void loadReceivedInvites();
      }
    };
    void trigger();
  }, [activeTab, myTeam, loadSuggestionsOrAgents, loadRecruitingTeams, loadSentInvites, loadReceivedInvites]);

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
      void loadSuggestionsOrAgents();
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
      void loadSentInvites();
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
      try {
        const teamData = await apiRequest<TeamData>("/teams/my-team");
        setMyTeam(teamData);
      } catch {
        setMyTeam(null);
      }
      void loadReceivedInvites();
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
      void loadReceivedInvites();
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
