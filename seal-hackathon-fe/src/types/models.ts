export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  skills: string[];
  teamId?: string | null;
  xp: number;
  recentActiveMs?: number;
  achievements?: string[];
  status?: string;
}

export interface Team {
  id: string;
  name: string;
  track: string;
  status: string;
  members: User[];
  assignedJudges?: string[];
  membersCount?: number;
  score?: number | null;
  initials?: string[];
}

export interface Round {
  id: string;
  name: string;
  deadline: string;
  status: string;
}

export interface Event {
  id: string | number;
  name: string;
  status: string;
  rounds?: Round[];
  season?: string;
  year?: string;
  participants?: number;
  daysLeft?: number;
  tracks?: string[];
  roundsCount?: number;
  icon?: string;
}

export interface CriteriaItem {
  key: string;
  name: string;
  weight: number;
  desc: string;
}

export interface CriteriaTemplate {
  id: string;
  name: string;
  totalWeight: number;
  usageCount: number;
  status: string;
  items: CriteriaItem[];
}

export interface Track {
  id: string;
  name: string;
  desc: string;
  mentor?: string;
  mentorInitials?: string;
  teamsCount?: number;
  status?: string;
}

export interface Submission {
  id: string;
  teamId?: string;
  eventId?: string;
  roundId?: string;
  repoUrl?: string;
  demoUrl?: string;
  reportUrl?: string;
  videoUrl?: string;
  description?: string;
  submittedAt?: string;
  team?: string;
  repo?: string;
  demo?: boolean;
  report?: boolean;
  lastCommit?: string;
  branch?: string;
  status: string;
  initials?: string;
}

export interface AwardConfig {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  prize: string;
  bonus: string;
  icon: string;
  color: string;
  assignedTo: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: string;
}

export interface PendingApproval {
  id: string;
  type: string;
  name: string;
  members?: number;
  track: string;
  date: string;
  status: string;
  role?: string;
}
