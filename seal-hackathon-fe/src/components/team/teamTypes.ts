export type TeamMember = {
  userId: string;
  fullName: string;
  email: string;
  studentCode?: string | null;
  role?: string;
  isKickPending?: boolean;
};

export type TeamDto = {
  teamId: string;
  teamName: string;
  status: string;
  leaderId: string;
  category: {
    categoryId: string;
    categoryName: string;
    eventName?: string;
  };
  eventStatus?: string | null;
  finalRank?: number | null;
  finalPrize?: string | null;
  currentRound: {
    roundId: string;
    roundName: string;
  } | null;
  members: TeamMember[];
  mentor?: {
    id: string;
    fullName: string;
    email: string;
    schoolName?: string | null;
  } | null;
  pendingMentorInvite?: {
    assignmentId: string;
    mentorName: string;
    invitedAt: string;
  } | null;
  judge?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
};

export type MentorInvitationDto = {
  assignmentId: string;
  teamId: string;
  teamName: string;
  categoryName: string;
  eventName: string;
  invitedAt: string;
};

export type MentorOption = {
  id: string;
  fullName: string;
  email: string;
  schoolName?: string | null;
  developerRole?: string | null;
  skills: string[];
  teamsMentored: number;
  availability: string;
};

export type EventDto = {
  eventId: string;
  eventName: string;
  registrationEndDate: string;
  categories: {
    categoryId: string;
    categoryName: string;
    teamCount: number;
  }[];
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
