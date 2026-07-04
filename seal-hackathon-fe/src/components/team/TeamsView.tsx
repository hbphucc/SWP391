"use client";
import { useTeamsData } from "./useTeamsData";
import NoTeamView from "./NoTeamView";
import TeamHeaderBar from "./TeamHeaderBar";
import TeamFinalResultsBanner from "./TeamFinalResultsBanner";
import TeamMembersPanel from "./TeamMembersPanel";
import MentorJudgePanels from "./MentorJudgePanels";
import AddMemberPanel from "./AddMemberPanel";
import InviteMentorModal from "./InviteMentorModal";
import KickRequestModal from "./KickRequestModal";
import PendingInvitesBanner from "@/components/dashboard/PendingInvitesBanner";

export default function TeamsView() {
  const {
    currentUser, myTeam, loading, submitting,
    createDrawerOpen, setCreateDrawerOpen,
    memberCodeToAdd, draftTeamName, setDraftTeamName,
    newLeaderCodeOrEmail, setNewLeaderCodeOrEmail,
    receivedInvites,
    mentoringTeams, judgingTeams, mentorInvitations,
    mentors, showMentorModal, setShowMentorModal, loadingMentors, mentorSearch, setMentorSearch, assigningMentorId,
    kickModalOpen, setKickModalOpen, setMemberToKick, kickReason, setKickReason,
    memberSuggestions, showMemberSuggestions,
    categories, hasActiveEvents, isLeader, canModifyMembers, canKickMembers, showActions,
    loadPage,
    handleAcceptInvite, handleDeclineInvite, handleAcceptMentorInvite, handleRejectMentorInvite,
    handleMemberInputChange, selectMemberSuggestion,
    handleAddMember, handleRemoveMember, handleSubmitKickRequest,
    handleUpdateTeam, handleLeaveTeam, handleTransferLeader,
    loadMentors, handleAssignMentor, handleRemoveMentor,
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
        mentorInvitations={mentorInvitations}
        categories={categories}
        hasActiveEvents={hasActiveEvents}
        createDrawerOpen={createDrawerOpen}
        setCreateDrawerOpen={setCreateDrawerOpen}
        onAcceptInvite={handleAcceptInvite}
        onDeclineInvite={handleDeclineInvite}
        onAcceptMentorInvite={handleAcceptMentorInvite}
        onRejectMentorInvite={handleRejectMentorInvite}
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

      <MentorJudgePanels
        myTeam={myTeam}
        isLeader={isLeader}
        onInviteMentorClick={() => { loadMentors(); setShowMentorModal(true); }}
        onRemoveMentor={handleRemoveMentor}
      />

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

      <InviteMentorModal
        open={showMentorModal}
        onClose={() => { if (!assigningMentorId) { setShowMentorModal(false); setMentorSearch(""); } }}
        mentorSearch={mentorSearch}
        setMentorSearch={setMentorSearch}
        loadingMentors={loadingMentors}
        mentors={mentors}
        myTeam={myTeam}
        submitting={submitting}
        assigningMentorId={assigningMentorId}
        onAssignMentor={handleAssignMentor}
      />

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
