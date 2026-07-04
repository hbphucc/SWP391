/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { App } from "antd";
import { CurrentUser, apiRequest, fetchCurrentUser, ApiError } from "@/lib/api";
import type { EventDto, InvitationResponse, MentorInvitationDto, MentorOption, TeamDto, TeamMember } from "./teamTypes";

export function useTeamsData() {
  const { message, modal } = App.useApp();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [myTeam, setMyTeam] = useState<TeamDto | null>(null);
  const [events, setEvents] = useState<EventDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [memberCodeToAdd, setMemberCodeToAdd] = useState("");
  const [draftTeamName, setDraftTeamName] = useState("");
  const [newLeaderCodeOrEmail, setNewLeaderCodeOrEmail] = useState("");
  const [receivedInvites, setReceivedInvites] = useState<InvitationResponse[]>([]);
  const hasTeamRef = useRef<boolean>(false);
  const [mentoringTeams, setMentoringTeams] = useState<TeamDto[]>([]);
  const [judgingTeams, setJudgingTeams] = useState<TeamDto[]>([]);
  const [mentorInvitations, setMentorInvitations] = useState<MentorInvitationDto[]>([]);

  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [mentorSearch, setMentorSearch] = useState("");
  const [assigningMentorId, setAssigningMentorId] = useState<string | null>(null);

  // Kick Request states
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [memberToKick, setMemberToKick] = useState<TeamMember | null>(null);
  const [kickReason, setKickReason] = useState("");

  const [memberSuggestions, setMemberSuggestions] = useState<{email: string, fullName: string, studentCode: string}[]>([]);
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => {
      setMemberSuggestions([]);
      setShowMemberSuggestions(false);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleMemberInputChange = async (val: string) => {
    setMemberCodeToAdd(val);
    if (!val.trim() || !myTeam?.category?.categoryId) {
      setMemberSuggestions([]);
      setShowMemberSuggestions(false);
      return;
    }
    setShowMemberSuggestions(true);
    try {
      const res = await apiRequest<{email: string, fullName: string, studentCode: string}[]>(
        `/teams/members/search?query=${encodeURIComponent(val)}&categoryId=${myTeam.category.categoryId}`
      );
      setMemberSuggestions(res);
    } catch {
      setMemberSuggestions([]);
    }
  };

  const selectMemberSuggestion = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMemberCodeToAdd(email);
    setMemberSuggestions([]);
    setShowMemberSuggestions(false);
  };

  const categories = useMemo(
    () =>
      events.flatMap((event) =>
        event.categories.map((category) => ({
          ...category,
          eventId: event.eventId,
          eventName: event.eventName,
          registrationEndDate: event.registrationEndDate,
        })),
      ),
    [events],
  );

  const hasActiveEvents = useMemo(() => {
    const now = new Date();
    return categories.some(c => new Date(c.registrationEndDate) >= now);
  }, [categories]);

  const isLeader = Boolean(myTeam && currentUser && myTeam.leaderId === currentUser.id);
  const canModifyMembers = isLeader && (myTeam?.status === "Pending" || myTeam?.status === "Eliminated");
  const canKickMembers = isLeader;

  const showActions = useMemo(() => {
    if (!myTeam || !currentUser) return false;
    return myTeam.members.some((member) => {
      const isMe = member.userId === currentUser.id;
      const memberIsLeader = member.userId === myTeam.leaderId;
      if (isMe) {
        return !memberIsLeader || myTeam.members.length === 1;
      }
      return canKickMembers;
    });
  }, [myTeam, currentUser, canKickMembers]);

  const loadPage = useCallback(async () => {
    setLoading(true);
    try {
      const [user, eventData] = await Promise.all([
        fetchCurrentUser(),
        apiRequest<EventDto[]>("/Events"),
      ]);

      setCurrentUser(user);
      setEvents(eventData);
      // Category preselection moved into CreateTeamDrawer (it defaults to the
      // first option supplied via props); the page no longer tracks it.

      let hasTeam = false;
      try {
        const team = await apiRequest<TeamDto>("/teams/my-team");
        if (!team) {
          throw new ApiError("Not joined", 404);
        }
        setMyTeam(team);
        setDraftTeamName(team.teamName);
        hasTeam = true;
        hasTeamRef.current = true;
      } catch (err) {
        const isNotFound = err instanceof ApiError && err.status === 404;
        const text = err instanceof Error ? err.message : "";
        if (!isNotFound && !text.toLowerCase().includes("not joined") && !text.toLowerCase().includes("not found")) {
          throw err;
        }
        setMyTeam(null);
        hasTeamRef.current = false;
      }

      if (!hasTeam) {
        if (user.roles?.includes("Mentor")) {
          try {
            const mentored = await apiRequest<TeamDto[]>("/teams/mentoring");
            setMentoringTeams(mentored);
          } catch {
            setMentoringTeams([]);
          }
          try {
            const invitations = await apiRequest<MentorInvitationDto[]>("/teams/mentor-invitations");
            setMentorInvitations(invitations);
          } catch {
            setMentorInvitations([]);
          }
        } else if (user.roles?.includes("Judge")) {
          try {
            const judging = await apiRequest<TeamDto[]>("/teams/judging");
            setJudgingTeams(judging);
          } catch {
            setJudgingTeams([]);
          }
        } else {
          try {
            const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
            setReceivedInvites(invites.filter((inv) => inv.status === "Pending"));
          } catch {
            setReceivedInvites([]);
          }
        }
      } else {
        setReceivedInvites([]);
      }
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load team data.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  const reloadTeamOnly = useCallback(async () => {
    if (!hasTeamRef.current) {
      try {
        const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
        setReceivedInvites((current) => {
          const pendingOnly = invites.filter((inv) => inv.status === "Pending");
          if (JSON.stringify(current) !== JSON.stringify(pendingOnly)) {
            return pendingOnly;
          }
          return current;
        });
      } catch {
        setReceivedInvites([]);
      }
      return;
    }

    try {
      const team = await apiRequest<TeamDto>("/teams/my-team");
      if (!team) {
        throw new ApiError("Not joined", 404);
      }
      setMyTeam((currentTeam) => {
        if (JSON.stringify(currentTeam) !== JSON.stringify(team)) {
          return team;
        }
        return currentTeam;
      });
      hasTeamRef.current = true;
      setDraftTeamName((currentDraft) => {
        if (!currentDraft && team.teamName) {
          return team.teamName;
        }
        return currentDraft;
      });
      setReceivedInvites([]);
    } catch (err) {
      const isNotFound = err instanceof ApiError && err.status === 404;
      const text = err instanceof Error ? err.message : "";
      if (isNotFound || text.toLowerCase().includes("not joined") || text.toLowerCase().includes("not found")) {
        setMyTeam(null);
        hasTeamRef.current = false;
        try {
          const invites = await apiRequest<InvitationResponse[]>("/teams/invitations/received");
          setReceivedInvites((current) => {
            const pendingOnly = invites.filter((inv) => inv.status === "Pending");
            if (JSON.stringify(current) !== JSON.stringify(pendingOnly)) {
              return pendingOnly;
            }
            return current;
          });
        } catch {
          setReceivedInvites([]);
        }
      }
    }
  }, []);

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

  const handleAcceptMentorInvite = async (assignmentId: string, teamName: string) => {
    try {
      await apiRequest(`/teams/mentor-invitations/${assignmentId}/accept`, { method: "POST" });
      message.success(`You are now mentoring ${teamName}.`);
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not accept invitation.");
    }
  };

  const handleRejectMentorInvite = async (assignmentId: string) => {
    try {
      await apiRequest(`/teams/mentor-invitations/${assignmentId}/reject`, { method: "POST" });
      message.success("Invitation declined.");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not decline invitation.");
    }
  };

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void reloadTeamOnly();
    }, 3000);

    const handleFocus = () => {
      void reloadTeamOnly();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [reloadTeamOnly]);

  // Team creation is now driven by CreateTeamDrawer, which posts to /teams with
  // an optional MentorId and handles the EventNotPublished branching itself.
  // We just refresh page state on success.

  const handleAddMember = async () => {
    if (!myTeam || !memberCodeToAdd.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest("/teams/my-team/members", {
        method: "POST",
        body: JSON.stringify({ studentCodeOrEmail: memberCodeToAdd.trim() }),
      });

      message.success("Invitation sent successfully.");
      setMemberCodeToAdd("");
      setMemberSuggestions([]);
      setShowMemberSuggestions(false);
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not invite member.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    if (!myTeam) return;

    const isApprovedTeam = ["Approved", "Active", "Champion"].includes(myTeam.status);

    if (isApprovedTeam) {
      setMemberToKick(member);
      setKickReason("");
      setKickModalOpen(true);
    } else {
      modal.confirm({
        title: "Kick member",
        content: `Are you sure you want to kick ${member.fullName} from the team?`,
        okText: "Kick",
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await apiRequest(`/teams/my-team/members/${encodeURIComponent(member.studentCode || member.email)}`, { method: "DELETE" });
            message.success("Member kicked successfully.");
            await loadPage();
          } catch (err) {
            message.error(err instanceof Error ? err.message : "Could not kick member.");
          }
        },
      });
    }
  };

  const handleSubmitKickRequest = async () => {
    if (!myTeam || !memberToKick || !kickReason.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest(`/teams/my-team/members/${memberToKick.userId}/kick-request`, {
        method: "POST",
        body: JSON.stringify({ reason: kickReason.trim() }),
      });
      message.success("Kick request submitted for Judge approval.");
      setKickModalOpen(false);
      setMemberToKick(null);
      setKickReason("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not submit kick request.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!myTeam || !draftTeamName.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest("/teams/my-team", {
        method: "PUT",
        body: JSON.stringify({ teamName: draftTeamName.trim() }),
      });

      message.success("Team updated successfully.");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update team.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveTeam = () => {
    const isDisband = isLeader && (myTeam?.status === "Champion" || myTeam?.status === "Eliminated" || myTeam?.eventStatus === "Completed");
    modal.confirm({
      title: isDisband ? "Disband team" : "Leave team",
      content: isDisband
        ? "Are you sure you want to disband this team? All members will be removed and the team will be closed."
        : "Are you sure you want to leave this team?",
      okText: isDisband ? "Disband" : "Leave",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest("/teams/leave", { method: "POST" });
          message.success(isDisband ? "Team disbanded successfully." : "You have left the team.");
          await loadPage();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not leave team.");
        }
      },
    });
  };

  const handleTransferLeader = async () => {
    if (!myTeam || !newLeaderCodeOrEmail.trim()) return;

    setSubmitting(true);
    try {
      await apiRequest("/teams/transfer-leader", {
        method: "PUT",
        body: JSON.stringify({ newLeaderStudentCodeOrEmail: newLeaderCodeOrEmail.trim() }),
      });

      message.success("Team leader transferred successfully.");
      setNewLeaderCodeOrEmail("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not transfer leader.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadMentors = async () => {
    setLoadingMentors(true);
    try {
      const data = await apiRequest<MentorOption[]>("/teams/mentors");
      setMentors(data);
    } catch {
      message.error("Could not load mentors list.");
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleAssignMentor = async (mentorId: string) => {
    // Guard against double-submit: ignore clicks while any assignment is in-flight.
    if (assigningMentorId) return;
    if (mentorId === myTeam?.mentor?.id) {
      message.info("This mentor is already selected for your team.");
      return;
    }
    setAssigningMentorId(mentorId);
    setSubmitting(true);
    try {
      await apiRequest("/teams/my-team/mentor", {
        method: "POST",
        body: JSON.stringify({ mentorUserId: mentorId }),
      });
      message.success("Mentor invited. Waiting for them to accept.");
      setShowMentorModal(false);
      setMentorSearch("");
      await loadPage();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not assign mentor.");
    } finally {
      setSubmitting(false);
      setAssigningMentorId(null);
    }
  };

  const handleRemoveMentor = () => {
    const hasActiveMentor = Boolean(myTeam?.mentor);
    modal.confirm({
      title: hasActiveMentor ? "Remove mentor" : "Cancel invitation",
      content: hasActiveMentor
        ? "Are you sure you want to remove the mentor from your team?"
        : "Cancel the pending mentor invitation?",
      okText: hasActiveMentor ? "Remove" : "Cancel Invite",
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await apiRequest("/teams/my-team/mentor", { method: "DELETE" });
          message.success(hasActiveMentor ? "Mentor removed successfully." : "Mentor invitation cancelled.");
          await loadPage();
        } catch (err) {
          message.error(err instanceof Error ? err.message : "Could not update mentor.");
        }
      },
    });
  };

  return {
    currentUser, myTeam, events, loading, submitting,
    createDrawerOpen, setCreateDrawerOpen,
    memberCodeToAdd, draftTeamName, setDraftTeamName,
    newLeaderCodeOrEmail, setNewLeaderCodeOrEmail,
    receivedInvites,
    mentoringTeams, judgingTeams, mentorInvitations,
    mentors, showMentorModal, setShowMentorModal, loadingMentors, mentorSearch, setMentorSearch, assigningMentorId,
    kickModalOpen, setKickModalOpen, memberToKick, setMemberToKick, kickReason, setKickReason,
    memberSuggestions, showMemberSuggestions,
    categories, hasActiveEvents, isLeader, canModifyMembers, canKickMembers, showActions,
    loadPage,
    handleAcceptInvite, handleDeclineInvite, handleAcceptMentorInvite, handleRejectMentorInvite,
    handleMemberInputChange, selectMemberSuggestion,
    handleAddMember, handleRemoveMember, handleSubmitKickRequest,
    handleUpdateTeam, handleLeaveTeam, handleTransferLeader,
    loadMentors, handleAssignMentor, handleRemoveMentor,
  };
}
