"use client";
import { Calendar, Trophy, Users, Search, Send, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import WorkspaceTabs, { WorkspaceTab } from "@/components/workspace/WorkspaceTabs";
import TeamsView from "@/components/team/TeamsView";
import MatchmakingView from "@/components/matchmaking/MatchmakingView";
import SubmissionsView from "@/components/submissions/SubmissionsView";
import RankingsView from "@/components/rankings/RankingsView";
import PrizesView from "@/components/prizes/PrizesView";
import PendingInvitesBanner from "@/components/dashboard/PendingInvitesBanner";
import DashboardStatsGrid from "@/components/dashboard/DashboardStatsGrid";
import DashboardOverviewPanel from "@/components/dashboard/DashboardOverviewPanel";
import { useDashboardData } from "./useDashboardData";

export default function DashboardPage() {
  const {
    activeTab, setActiveTab,
    filteredEvents,
    receivedInvites,
    metrics,
    activities,
    deadlines,
    myTeam,
    myRegistrations,
    userRoles, isAdmin, canJudge, isMemberish, currentUserId,
    handleAcceptInvite, handleDeclineInvite, handleRegisterEvent,
  } = useDashboardData();

  return (
    <div>
      {/* Banner — portrait clip rotated 90° to fill the wide banner */}
      <div style={{ position: 'relative', width: '100%', height: 'clamp(160px, 18vw, 320px)', borderRadius: '1rem', overflow: 'hidden', marginTop: '-1rem', marginBottom: '1.5rem', containerType: 'size', background: '#000' }}>
        <video
          src="/images/dashboard_header.mp4"
          poster="/images/dashboard_header.png"
          autoPlay
          loop
          muted
          playsInline
          style={{ position: 'absolute', top: '50%', left: '50%', height: '100cqw', width: 'auto', transform: 'translate(-50%, -50%) rotate(270deg)' }}
        />
      </div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: receivedInvites.length > 0 ? "1.5rem" : "2rem" }}>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/admin/events?action=create">
              <button className="btn btn-primary"><Calendar size={16} /> New Event</button>
            </Link>
          </div>
        )}
      </div>

      <PendingInvitesBanner
        invites={receivedInvites}
        myTeam={myTeam}
        currentUserId={currentUserId}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />

      <DashboardStatsGrid metrics={metrics} />

      <WorkspaceTabs
        defaultTab="overview"
        tabs={[
          {
            id: "overview",
            label: "Overview",
            icon: LayoutDashboard,
            render: () => (
              <DashboardOverviewPanel
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                filteredEvents={filteredEvents}
                userRoles={userRoles}
                myRegistrations={myRegistrations}
                onRegisterEvent={handleRegisterEvent}
                deadlines={deadlines}
                isAdmin={isAdmin}
                canJudge={canJudge}
                activities={activities}
              />
            ),
          },
          ...(!isAdmin
            ? [
                {
                  id: "team",
                  label: "My Team",
                  icon: Users,
                  badge: receivedInvites.length,
                  render: () => <TeamsView />,
                } satisfies WorkspaceTab,
              ]
            : []),
          ...(isMemberish
            ? [
                {
                  id: "matchmaking",
                  label: "Matchmaking",
                  icon: Search,
                  render: () => <MatchmakingView />,
                } satisfies WorkspaceTab,
                {
                  id: "submissions",
                  label: "Submissions",
                  icon: Send,
                  render: () => <SubmissionsView />,
                } satisfies WorkspaceTab,
              ]
            : []),
          {
            id: "results",
            label: "Results",
            icon: Trophy,
            render: () => (
              <div>
                <RankingsView embedded />
                <div style={{ marginTop: "2rem" }}>
                  <PrizesView />
                </div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
