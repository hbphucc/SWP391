export type ActivityItem = {
  title: string;
  message: string;
  time: string;
  type: string;
};

export type DeadlineItem = {
  event: string;
  task: string;
  date: string;
  urgent: boolean;
};

export type DashboardMetrics = {
  activeEvents: number;
  totalEvents: number;
  totalTeams: number;
  totalTracks: number;
  upcomingEvent: string;
};

export type MappedEvent = {
  id: string;
  name: string;
  status: string;
  currentRound?: string;
  teamsCount: number;
  tracksCount: number;
  endDate: string;
};

export type InvitationResponse = {
  id: string;
  teamId: string;
  teamName: string;
  inviterUserId: string;
  inviterUserName: string;
  inviteeUserId: string;
  inviteeUserName: string;
  inviteeUserEmail: string;
  status: string;
  message?: string;
  createdAt: string;
};

export type DashboardTeamSummary = {
  teamId: string;
  teamName: string;
  leaderId: string;
};
