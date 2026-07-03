import { Users, GraduationCap, Crown, Plus } from "lucide-react";
import { CurrentUser } from "@/lib/api";
import StatusBadge from "@/components/StatusBadge";
import CreateTeamDrawer from "@/components/team/CreateTeamDrawer";
import PendingInvitesBanner from "@/components/dashboard/PendingInvitesBanner";
import type { TeamDto, MentorInvitationDto, InvitationResponse } from "./useTeamsData";
import styles from "./NoTeamView.module.css";

interface CategoryOption {
  categoryId: string;
  categoryName: string;
  teamCount: number;
  eventId: string;
  eventName: string;
  registrationEndDate: string;
}

interface NoTeamViewProps {
  currentUser: CurrentUser | null;
  receivedInvites: InvitationResponse[];
  mentoringTeams: TeamDto[];
  judgingTeams: TeamDto[];
  mentorInvitations: MentorInvitationDto[];
  categories: CategoryOption[];
  hasActiveEvents: boolean;
  createDrawerOpen: boolean;
  setCreateDrawerOpen: (open: boolean) => void;
  onAcceptInvite: (id: string, teamName: string) => void;
  onDeclineInvite: (id: string) => void;
  onAcceptMentorInvite: (assignmentId: string, teamName: string) => void;
  onRejectMentorInvite: (assignmentId: string) => void;
  onLoadPage: () => void;
}

export default function NoTeamView({
  currentUser, receivedInvites, mentoringTeams, judgingTeams, mentorInvitations,
  categories, hasActiveEvents, createDrawerOpen, setCreateDrawerOpen,
  onAcceptInvite, onDeclineInvite, onAcceptMentorInvite, onRejectMentorInvite, onLoadPage,
}: NoTeamViewProps) {
  return (
    <div className={styles.wrapper}>
      <div className={`page-header ${styles.header}`}>
        <div className={styles.headerIconWrap}>
          <Users size={32} className={styles.headerIcon} />
        </div>
        <h1 className={`page-title ${styles.headerTitle}`}>You are not in a team</h1>
        <p className="page-subtitle">Register a team through the backend approval flow.</p>
      </div>

      <PendingInvitesBanner
        invites={receivedInvites}
        myTeam={null}
        currentUserId={currentUser?.id ?? null}
        onAccept={onAcceptInvite}
        onDecline={onDeclineInvite}
      />

      {currentUser?.roles?.includes("Mentor") ? (
        <>
        {mentorInvitations.length > 0 && (
          <div className={`glass-card ${styles.invitationsPanel}`}>
            <h3 className={styles.invitationsPanelTitle}>
              <GraduationCap size={22} className={styles.invitationsPanelIcon} /> Pending Mentor Invitations
            </h3>
            <div className={styles.invitationsList}>
              {mentorInvitations.map((inv) => (
                <div key={inv.assignmentId} className={styles.invitationRow}>
                  <div>
                    <div className={styles.invitationTeamName}>{inv.teamName}</div>
                    <div className={styles.invitationMeta}>{inv.eventName} · {inv.categoryName}</div>
                  </div>
                  <div className={styles.invitationActions}>
                    <button className="btn btn-primary btn-sm" onClick={() => onAcceptMentorInvite(inv.assignmentId, inv.teamName)}>
                      Accept
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => onRejectMentorInvite(inv.assignmentId)}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className={`glass-card ${styles.assignmentPanel}`}>
          <div className={styles.assignmentPanelHeader}>
            <div className={styles.assignmentPanelIconWrap}>
              <Users size={24} />
            </div>
            <div>
              <h3 className={styles.assignmentPanelTitle}>Teams You Are Mentoring</h3>
              <p className={styles.assignmentPanelSubtitle}>
                {mentoringTeams.length} {mentoringTeams.length === 1 ? "team" : "teams"} assigned to you.
              </p>
            </div>
          </div>

          {mentoringTeams.length > 0 ? (
            <div className={styles.assignmentGrid}>
              {mentoringTeams.map(team => (
                <div key={team.teamId} className={styles.assignmentCard}>
                  <div className={styles.assignmentCardHeader}>
                    <div>
                      <h4 className={styles.assignmentCardTitle}>{team.teamName}</h4>
                      <span className={styles.assignmentCardMeta}>{team.category.eventName} - {team.category.categoryName}</span>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>
                  <div className={styles.assignmentCardBody}>
                    <p><strong>Members:</strong> {team.members.length}</p>
                    {team.currentRound && (
                      <p><strong>Round:</strong> {team.currentRound.roundName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.assignmentEmptyState}>
              <Users size={32} className={styles.assignmentEmptyIcon} />
              <p className={styles.assignmentEmptyText}>You haven&apos;t been assigned to mentor any teams yet.</p>
            </div>
          )}
        </div>
        </>
      ) : currentUser?.roles?.includes("Judge") ? (
        <div className={`glass-card ${styles.assignmentPanel}`}>
          <div className={styles.assignmentPanelHeader}>
            <div className={styles.assignmentPanelIconWrap}>
              <Users size={24} />
            </div>
            <div>
              <h3 className={styles.assignmentPanelTitle}>Teams You Are Judging</h3>
              <p className={styles.assignmentPanelSubtitle}>
                {judgingTeams.length} {judgingTeams.length === 1 ? "team" : "teams"} assigned to you.
              </p>
            </div>
          </div>

          {judgingTeams.length > 0 ? (
            <div className={styles.assignmentGrid}>
              {judgingTeams.map(team => (
                <div key={team.teamId} className={styles.assignmentCard}>
                  <div className={styles.assignmentCardHeader}>
                    <div>
                      <h4 className={styles.assignmentCardTitle}>{team.teamName}</h4>
                      <span className={styles.assignmentCardMeta}>{team.category.eventName} - {team.category.categoryName}</span>
                    </div>
                    <StatusBadge status={team.status} />
                  </div>
                  <div className={styles.assignmentCardBody}>
                    <p><strong>Members:</strong> {team.members.length}</p>
                    {team.currentRound && (
                      <p><strong>Round:</strong> {team.currentRound.roundName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.assignmentEmptyState}>
              <Users size={32} className={styles.assignmentEmptyIcon} />
              <p className={styles.assignmentEmptyText}>You haven&apos;t been assigned to judge any teams yet.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={`glass-card ${styles.ctaPanel}`}>
          <div className={styles.ctaIconWrap}>
            <Crown size={24} />
          </div>
          <h3 className={styles.ctaTitle}>Ready to compete?</h3>
          <p className={styles.ctaDesc}>
            Create a team in one screen: pick a category, invite members, and optionally choose a mentor.
          </p>
          <button
            className={`btn btn-primary btn-lg ${styles.ctaButton}`}
            onClick={() => setCreateDrawerOpen(true)}
            disabled={!hasActiveEvents}
            title={!hasActiveEvents ? "Registration for all events has closed." : ""}
          >
            <Plus size={18} /> Create a Team
          </button>
          {!hasActiveEvents && categories.length > 0 && (
            <div className={styles.ctaClosedNotice}>
              Registration for all current events has ended.
            </div>
          )}
        </div>
      )}

      <CreateTeamDrawer
        open={createDrawerOpen}
        onClose={() => setCreateDrawerOpen(false)}
        onSuccess={onLoadPage}
        categories={categories}
      />
    </div>
  );
}
