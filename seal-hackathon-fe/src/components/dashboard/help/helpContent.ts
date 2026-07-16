import {
  Award,
  Bell,
  CalendarCheck,
  FileUp,
  Gavel,
  Lightbulb,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export type HelpRole = "Participant" | "Team Leader" | "Judge" | "Mentor" | "Admin";

export type HelpTopic = {
  id: string;
  title: string;
  role: HelpRole;
  icon: LucideIcon;
  summary: string;
  steps: string[];
  tips: string[];
  links: { label: string; href: string }[];
};

export type FaqItem = {
  question: string;
  answer: string;
  role?: HelpRole;
};

export type GlossaryItem = {
  term: string;
  description: string;
};

export const HELP_ROLES: HelpRole[] = ["Participant", "Team Leader", "Judge", "Mentor", "Admin"];

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "join-event",
    title: "Join an event",
    role: "Participant",
    icon: CalendarCheck,
    summary: "Use the event catalog to find active hackathons and register before the deadline closes.",
    steps: [
      "Open Events from the dashboard navigation.",
      "Choose an event with an open registration window.",
      "Review the event schedule, tracks, rounds, and submission expectations.",
      "Register for the event, then create or join a team for the right track.",
      "Return to the dashboard to confirm that the event appears in your workspace.",
    ],
    tips: [
      "If registration is closed, contact an organizer instead of creating a duplicate team.",
      "Check the track description before choosing because teams are grouped by track.",
    ],
    links: [
      { label: "Browse Events", href: "/dashboard/events" },
      { label: "View Tracks", href: "/dashboard/tracks" },
    ],
  },
  {
    id: "create-team",
    title: "Create and manage a team",
    role: "Team Leader",
    icon: Users,
    summary: "Team leaders organize members, invitations, mentors, and readiness for each round.",
    steps: [
      "Open My Team and start a new team if you are not already in one.",
      "Pick the event category or track that matches your project idea.",
      "Invite members using the available invite or matchmaking flows.",
      "Monitor pending invitations and remove stale ones before the round starts.",
      "Keep the team profile updated so mentors and judges see the right context.",
    ],
    tips: [
      "Use a team name that is recognizable in judge assignments and rankings.",
      "Confirm every teammate can log in before submission day.",
    ],
    links: [
      { label: "Open My Team", href: "/dashboard/teams" },
      { label: "Find Teammates", href: "/dashboard/matchmaking" },
    ],
  },
  {
    id: "submission-checklist",
    title: "Prepare a submission",
    role: "Participant",
    icon: FileUp,
    summary: "A strong submission should be easy for judges to open, run, and evaluate.",
    steps: [
      "Confirm the repository link is accessible to judges.",
      "Open the demo link in a private browser window to verify access.",
      "Upload slides, reports, or supporting documents if the round requires them.",
      "Write a submission title that matches the project and round.",
      "Submit before the deadline, then reopen the page to verify it was saved.",
    ],
    tips: [
      "Avoid private links unless judges have explicit access.",
      "Keep the latest demo and slide links in one place before the deadline.",
    ],
    links: [
      { label: "Open Submissions", href: "/dashboard/submissions" },
      { label: "Manage Documents", href: "/dashboard/documents" },
    ],
  },
  {
    id: "judging-flow",
    title: "Score assigned teams",
    role: "Judge",
    icon: Gavel,
    summary: "Judges evaluate submissions by event, round, team, and criteria.",
    steps: [
      "Open Scoring from the dashboard navigation.",
      "Select an assigned event, round, category, or team.",
      "Review the submission, repository, demo, and attached documents.",
      "Enter scores according to each criterion and add useful feedback.",
      "Save the evaluation and confirm the score appears before leaving the page.",
    ],
    tips: [
      "Use the same interpretation of criteria across teams in the same round.",
      "If a submission link is inaccessible, record that in feedback instead of guessing.",
    ],
    links: [
      { label: "Open Scoring", href: "/dashboard/judging" },
      { label: "View Rankings", href: "/dashboard/rankings" },
    ],
  },
  {
    id: "mentor-support",
    title: "Support teams as a mentor",
    role: "Mentor",
    icon: Lightbulb,
    summary: "Mentors help teams clarify scope, improve delivery, and stay aware of deadlines.",
    steps: [
      "Open the Mentor Workspace after your mentor role is approved.",
      "Review pending invitations and accept the teams you can support.",
      "Check team track, current round, members, and submission history.",
      "Give feedback on scope, technical risks, demo clarity, and presentation flow.",
      "Keep mentoring guidance separate from judging decisions.",
    ],
    tips: [
      "Encourage teams to reduce scope if the deadline is close.",
      "Focus on questions and tradeoffs rather than rewriting the team's solution.",
    ],
    links: [
      { label: "Mentor Workspace", href: "/mentor" },
      { label: "Team Workspace", href: "/dashboard/teams" },
    ],
  },
  {
    id: "admin-event-setup",
    title: "Set up an event",
    role: "Admin",
    icon: ShieldCheck,
    summary: "Admins prepare the event structure that participants, mentors, and judges rely on.",
    steps: [
      "Create an event with registration, start, and end dates.",
      "Attach tracks, rounds, criteria, prizes, and supporting documents.",
      "Publish the event only after the schedule and rules are ready.",
      "Approve users and teams before restricted workflows begin.",
      "Assign judges by round, category, or team before scoring opens.",
    ],
    tips: [
      "Use system notifications for date changes and rule clarifications.",
      "Create criteria before judges start scoring to avoid inconsistent evaluations.",
    ],
    links: [
      { label: "Admin Events", href: "/admin/events" },
      { label: "User Approvals", href: "/admin/users" },
    ],
  },
  {
    id: "results-and-prizes",
    title: "Read results and prizes",
    role: "Participant",
    icon: Award,
    summary: "Results depend on scoring completion, ranking rules, and organizer publication timing.",
    steps: [
      "Open Results to view rankings for available rounds.",
      "Check whether your team's latest submission has been evaluated.",
      "Review final ranks and prizes after the event is completed.",
      "If a score looks missing, contact an organizer with your team and round details.",
    ],
    tips: [
      "Rankings may change while judges are still evaluating.",
      "Final prizes are usually reliable only after the event is marked completed.",
    ],
    links: [
      { label: "View Rankings", href: "/dashboard/rankings" },
      { label: "View Prizes", href: "/dashboard/prizes" },
    ],
  },
  {
    id: "announcements",
    title: "Send announcements",
    role: "Admin",
    icon: Bell,
    summary: "System notifications keep participants aligned when rules or schedules change.",
    steps: [
      "Open System Notifications from the admin portal.",
      "Write a short title that clearly identifies the affected event or workflow.",
      "Include the action users should take and the relevant deadline.",
      "Send the announcement, then review broadcast history for confirmation.",
    ],
    tips: [
      "Use announcements for important changes, not routine reminders.",
      "Keep the message specific so users know whether it applies to them.",
    ],
    links: [
      { label: "System Notifications", href: "/admin/system-notifications" },
      { label: "Audit Logs", href: "/admin/audit-logs" },
    ],
  },
];

export const SUBMISSION_CHECKLIST = [
  "Team name and member list are correct",
  "Repository URL is accessible",
  "Demo URL opens without private credentials",
  "Slides or supporting documents are uploaded",
  "Submission title describes the project clearly",
  "Round deadline has been checked",
  "One teammate has verified the submitted links",
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Why can I see an event but cannot register?",
    answer: "Registration may be closed, the event may still be in draft, or your current role/team status may not satisfy the event rules.",
    role: "Participant",
  },
  {
    question: "Can I change my team after joining?",
    answer: "Use My Team to manage invitations and members. If the event has started, ask an organizer before making major membership changes.",
    role: "Team Leader",
  },
  {
    question: "What makes a submission judge-friendly?",
    answer: "A working repository, accessible demo, clear slides, and a concise title help judges evaluate quickly and consistently.",
    role: "Participant",
  },
  {
    question: "When do rankings appear?",
    answer: "Rankings depend on judge evaluations and event workflow. They may stay empty until enough scores are saved or the round is published.",
    role: "Judge",
  },
  {
    question: "How are mentor and judge roles approved?",
    answer: "Users request roles, then admins approve them from user management. Until approval, restricted mentor or judge tools may be hidden.",
    role: "Admin",
  },
  {
    question: "What should I do if a team cannot access a document?",
    answer: "Ask the team to upload the document again or provide a link with the correct sharing permissions before judging starts.",
    role: "Mentor",
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: "Event",
    description: "A hackathon program with registration dates, rounds, tracks, teams, and final results.",
  },
  {
    term: "Track",
    description: "A category such as AI, Web, Mobile, Security, or Open Innovation that groups teams by theme.",
  },
  {
    term: "Round",
    description: "A stage of the event with its own deadline, submissions, criteria, and judge assignments.",
  },
  {
    term: "Criteria",
    description: "The scoring dimensions judges use to evaluate submissions.",
  },
  {
    term: "Submission",
    description: "A team's delivered work for a round, usually including repository, demo, and documents.",
  },
  {
    term: "Mentor",
    description: "A support role that guides teams without replacing judge scoring decisions.",
  },
];
