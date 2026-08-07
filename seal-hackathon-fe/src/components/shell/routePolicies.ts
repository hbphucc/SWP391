// Declarative per-portal access rules, extracted from what admin/layout.tsx and
// dashboard/layout.tsx each hand-rolled independently.
// AccessGate reads one of these; AppShell picks the policy from `portal`.

export type Portal = "admin" | "dashboard";

export type AccessPolicy = {
  // Roles allowed in, or null if any authenticated user qualifies.
  allowedRoles: string[] | null;
  redirectUnauthenticatedTo: (pathname: string) => string;
  redirectUnauthorizedTo: string;
  // Message.error() shown when an authenticated-but-unauthorized user is
  // redirected away. Admin is the only portal that surfaces one today.
  unauthorizedMessage?: string;
  loadingLabel: string;
};

/**
 * Routes a role may not enter even though its portal admits it.
 *
 * The dashboard portal is open to every authenticated user (allowedRoles: null)
 * because it also hosts everyone's profile, settings and notifications. But its
 * competition routes — forming a team, submitting work, finding teammates — make
 * no sense for a Mentor, who supports teams rather than competing in them.
 * Rather than close the whole portal (which would strand mentors with no way to
 * edit their own account), we deny just those routes.
 *
 * Prefix match: an entry covers its subpaths, so "/dashboard/teams" also covers
 * "/dashboard/teams/<id>".
 */
const COMPETITION_ROUTES = ["/dashboard/teams", "/dashboard/submissions", "/dashboard/matchmaking"];

const ROLE_DENIED_ROUTES: Record<string, string[]> = {
  Mentor: COMPETITION_ROUTES,
  // Judges are kept out for the same reason as mentors, and it matters more now:
  // one person can hold both roles, and the rule below only bars a path when
  // every role they hold bars it. Leaving Judge off the list handed anyone who
  // judged and mentored a way back into the competition routes.
  Judge: COMPETITION_ROUTES,
};

/**
 * The inverse rule: routes only certain roles may enter at all.
 *
 * The mentor workspace used to be its own portal, which gated it by role for
 * free. Folding it into the dashboard — so a Mentor who also judges sees one
 * sidebar instead of two — meant that gate had to move here, or the workspace
 * would have opened to every signed-in user.
 *
 * Prefix match, same as the denial list.
 */
const ROUTE_REQUIRED_ROLES: Record<string, string[]> = {
  "/dashboard/mentor": ["Mentor", "Admin"],
  "/dashboard/judging": ["Judge", "Admin"],
  "/dashboard/analytics": ["Judge", "Admin"],
};

/**
 * True when any of the user's roles is denied this path. A user holding several
 * roles is denied only if *every* role is denied it, so an Admin-and-Mentor
 * account keeps full access.
 */
export function isRouteDeniedForRoles(pathname: string, roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;

  const matchesPrefix = (prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

  // A route reserved for particular roles turns everyone else away, whatever
  // else they hold.
  for (const [prefix, required] of Object.entries(ROUTE_REQUIRED_ROLES)) {
    if (matchesPrefix(prefix) && !required.some((role) => roles.includes(role))) return true;
  }

  return roles.every((role) => {
    const denied = ROLE_DENIED_ROUTES[role];
    if (!denied) return false;
    return denied.some(matchesPrefix);
  });
}

/**
 * Where a user lands when they sign in without an explicit `?redirect=`.
 * Mentors do not compete, so they open on their workspace rather than the
 * participant dashboard. Admin wins because /admin is a superset of both.
 */
export function getRoleLandingPath(roles: string[] | undefined): string {
  if (!roles) return "/dashboard";
  if (roles.includes("Admin")) return "/admin";
  if (roles.includes("Mentor")) return "/dashboard/mentor";
  return "/dashboard";
}

export const routePolicies: Record<Portal, AccessPolicy> = {
  admin: {
    allowedRoles: ["Admin"],
    redirectUnauthenticatedTo: () => "/admin/login",
    redirectUnauthorizedTo: "/dashboard",
    unauthorizedMessage: "Access denied. Admin privileges required.",
    loadingLabel: "Verifying access...",
  },
  dashboard: {
    allowedRoles: null,
    redirectUnauthenticatedTo: (pathname) => `/auth/login?redirect=${encodeURIComponent(pathname)}`,
    redirectUnauthorizedTo: "/dashboard",
    loadingLabel: "Verifying session...",
  },
};
