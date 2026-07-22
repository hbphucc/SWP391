import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Trophy,
  Settings,
  BookOpen,
  Cloud,
  Tag,
  Target,
  Bell,
  Mail,
  CircleHelp,
} from "lucide-react";
import type { Portal } from "./routePolicies";

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  // Roles allowed to see this item, or null if any authenticated user can.
  roles: string[] | null;
  portals: Portal[];
  section: "Main" | "Events" | "Judging" | "Content" | "System";
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

// Every nav item across all 3 portals, flattened. Each item belongs to
// exactly one portal — extracted 1:1 from Sidebar.tsx's previous inline
// portal-branching (isAdminPortal / pathname.startsWith("/mentor") / default)
// with one simplification: the old code additionally hid System/Judging
// items from non-admins by section+label name on the dashboard portal, but
// every item that rule targeted (User Approvals, Audit Logs, System
// Notifications, Criteria) already carries `roles: ["Admin"]`, so the
// role check below already excludes them for non-admins — the extra rule
// was redundant and is not reproduced here.
export const NAV_ITEMS: NavItem[] = [
  // --- Dashboard portal (Member / TeamLeader / Judge / Admin-while-here) ---
  { id: "dash-home", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: null, portals: ["dashboard"], section: "Main" },
  { id: "dash-events", label: "Events", href: "/dashboard/events", icon: Calendar, roles: null, portals: ["dashboard", "mentor"], section: "Events" },
  { id: "dash-tracks", label: "Tracks", href: "/dashboard/tracks", icon: Tag, roles: null, portals: ["dashboard", "mentor"], section: "Events" },
  { id: "dash-criteria", label: "Criteria", href: "/admin/events?tab=criteria", icon: FileText, roles: ["Admin"], portals: ["dashboard"], section: "Judging" },
  { id: "dash-scoring", label: "Scoring", href: "/dashboard/judging", icon: Target, roles: ["Judge", "Admin"], portals: ["dashboard"], section: "Judging" },
  { id: "dash-rankings", label: "Rankings", href: "/dashboard/rankings", icon: Trophy, roles: null, portals: ["dashboard", "mentor"], section: "Judging" },
  { id: "dash-help", label: "Guide", href: "/dashboard/help", icon: CircleHelp, roles: null, portals: ["dashboard", "mentor"], section: "Content" },
  { id: "dash-documents", label: "Documents", href: "/dashboard/documents", icon: FileText, roles: null, portals: ["dashboard"], section: "Content" },
  { id: "dash-storage", label: "Storage", href: "/dashboard/storage", icon: Cloud, roles: ["Admin"], portals: ["dashboard"], section: "Content" },
  { id: "dash-analytics", label: "Analytics", href: "/dashboard/analytics", icon: BookOpen, roles: ["Judge"], portals: ["dashboard"], section: "Content" },
  { id: "dash-user-approvals", label: "User Approvals", href: "/admin/users", icon: Users, roles: ["Admin"], portals: ["dashboard"], section: "System" },
  { id: "dash-audit-logs", label: "Audit Logs", href: "/admin/audit-logs", icon: FileText, roles: ["Admin"], portals: ["dashboard"], section: "System" },
  { id: "dash-system-notifications", label: "System Notifications", href: "/admin/system-notifications", icon: Bell, roles: ["Admin"], portals: ["dashboard"], section: "System" },
  { id: "dash-settings", label: "Settings", href: "/dashboard/settings", icon: Settings, roles: null, portals: ["dashboard", "mentor"], section: "System" },

  // --- Admin portal ---
  { id: "admin-home", label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["Admin"], portals: ["admin"], section: "Main" },
  { id: "admin-events", label: "Events", href: "/admin/events", icon: Calendar, roles: ["Admin"], portals: ["admin"], section: "Events" },
  { id: "admin-teams", label: "Teams", href: "/admin/teams", icon: Users, roles: ["Admin"], portals: ["admin"], section: "Events" },
  { id: "admin-scoring-queue", label: "Scoring Queue", href: "/admin/judging", icon: Trophy, roles: ["Admin"], portals: ["admin"], section: "Judging" },
  { id: "admin-analytics", label: "Research Analytics", href: "/admin/analytics", icon: BookOpen, roles: ["Admin"], portals: ["admin"], section: "Judging" },
  { id: "admin-user-approvals", label: "User Approvals", href: "/admin/users", icon: Users, roles: ["Admin"], portals: ["admin"], section: "System" },
  { id: "admin-audit-logs", label: "Audit Logs", href: "/admin/audit-logs", icon: FileText, roles: ["Admin"], portals: ["admin"], section: "System" },
  { id: "admin-system-notifications", label: "System Notifications", href: "/admin/system-notifications", icon: Bell, roles: ["Admin"], portals: ["admin"], section: "System" },
  { id: "admin-settings", label: "Settings", href: "/admin/settings", icon: Settings, roles: ["Admin"], portals: ["admin"], section: "System" },

  // --- Mentor portal ---
  { id: "mentor-home", label: "Mentor Workspace", href: "/mentor", icon: LayoutDashboard, roles: ["Mentor", "Admin"], portals: ["mentor", "dashboard"], section: "Main" },
  // NavItem has no dynamic badge field; the pending count renders on the
  // mentor page's WorkspaceTabs badge instead.
  { id: "mentor-invitations", label: "Invitations", href: "/mentor?tab=invitations", icon: Mail, roles: ["Mentor", "Admin"], portals: ["mentor", "dashboard"], section: "Main" },
  { id: "mentor-documents", label: "Documents", href: "/mentor/documents", icon: FileText, roles: ["Mentor", "Admin"], portals: ["mentor"], section: "Content" },
];

// Section render order is the same for every portal (matches the original
// ALL_NAV_SECTIONS array order); empty sections are dropped.
const SECTION_ORDER: NavItem["section"][] = ["Main", "Events", "Judging", "Content", "System"];

export function getVisibleNav(portal: Portal, userRoles: string[]): NavSection[] {
  return SECTION_ORDER.map((title) => ({
    title,
    items: NAV_ITEMS.filter(
      (item) =>
        item.portals.includes(portal) &&
        item.section === title &&
        (item.roles === null || item.roles.some((role) => userRoles.includes(role))),
    ),
  })).filter((section) => section.items.length > 0);
}
