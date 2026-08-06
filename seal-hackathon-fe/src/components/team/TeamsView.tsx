"use client";
import { useTeamsData } from "./useTeamsData";
import NoTeamView from "./NoTeamView";
import TeamHeaderBar from "./TeamHeaderBar";
import TeamFinalResultsBanner from "./TeamFinalResultsBanner";
import TeamMembersPanel from "./TeamMembersPanel";
import MentorJudgePanels from "./MentorJudgePanels";
import AddMemberPanel from "./AddMemberPanel";
import KickRequestModal from "./KickRequestModal";
import PendingInvitesBanner from "@/components/dashboard/PendingInvitesBanner";
import TeamChatPanel from "./TeamChatPanel";

export default function TeamsView() {
  const {
    currentUser, myTeam, loading, submitting,
    createDrawerOpen, setCreateDrawerOpen,
    memberCodeToAdd, draftTeamName, setDraftTeamName,
    newLeaderCodeOrEmail, setNewLeaderCodeOrEmail,
    receivedInvites,
    mentoringTeams, judgingTeams,
    kickModalOpen, setKickModalOpen, setMemberToKick, kickReason, setKickReason,
    memberSuggestions, showMemberSuggestions,
    categories, hasActiveEvents, isLeader, canModifyMembers, canKickMembers, showActions,
    loadPage,
    handleAcceptInvite, handleDeclineInvite,
    handleMemberInputChange, selectMemberSuggestion,
    handleAddMember, handleRemoveMember, handleSubmitKickRequest,
    handleUpdateTeam, handleLeaveTeam, handleTransferLeader,
  } = useTeamsData();

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading team</div>
      </div>
    );
  }

  if (!currentUser) return null;

  if (!myTeam) {
    return (
      <NoTeamView
        currentUser={currentUser}
        receivedInvites={receivedInvites}
        mentoringTeams={mentoringTeams}
        judgingTeams={judgingTeams}
        categories={categories}
        hasActiveEvents={hasActiveEvents}
        createDrawerOpen={createDrawerOpen}
        setCreateDrawerOpen={setCreateDrawerOpen}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
        onLoadPage={loadPage}
      />
    );
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <TeamHeaderBar
        myTeam={myTeam}
        isLeader={isLeader}
        loading={loading}
        submitting={submitting}
        onRefresh={loadPage}
        onLeaveTeam={handleLeaveTeam}
      />

      <TeamFinalResultsBanner myTeam={myTeam} />

      <PendingInvitesBanner
        invites={receivedInvites}
        myTeam={myTeam}
        currentUserId={currentUser.id}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      <TeamMembersPanel
        myTeam={myTeam}
        currentUser={currentUser}
        canModifyMembers={canModifyMembers}
        canKickMembers={canKickMembers}
        showActions={showActions}
        submitting={submitting}
        draftTeamName={draftTeamName}
        setDraftTeamName={setDraftTeamName}
        onUpdateTeam={handleUpdateTeam}
        newLeaderCodeOrEmail={newLeaderCodeOrEmail}
        setNewLeaderCodeOrEmail={setNewLeaderCodeOrEmail}
        onTransferLeader={handleTransferLeader}
        onLeaveTeam={handleLeaveTeam}
        onRemoveMember={handleRemoveMember}
      />

      {/* Read-only now: an organiser allocates mentors per round, so the team sees
          who it was given rather than choosing. */}
      <MentorJudgePanels myTeam={myTeam} isLeader={isLeader} />

      <div style={{ marginTop: "2rem", marginBottom: "2rem" }}>
        <TeamChatPanel teamId={myTeam.teamId} />
      </div>

      {canModifyMembers && (
        <AddMemberPanel
          memberCodeToAdd={memberCodeToAdd}
          onMemberInputChange={handleMemberInputChange}
          onSelectSuggestion={selectMemberSuggestion}
          memberSuggestions={memberSuggestions}
          showMemberSuggestions={showMemberSuggestions}
          submitting={submitting}
          onAddMember={handleAddMember}
        />
      )}

      <KickRequestModal
        open={kickModalOpen}
        onClose={() => {
          if (!submitting) {
            setKickModalOpen(false);
            setMemberToKick(null);
            setKickReason("");
          }
        }}
        onSubmit={handleSubmitKickRequest}
        submitting={submitting}
        kickReason={kickReason}
        setKickReason={setKickReason}
      />
    </div>
  );
}
