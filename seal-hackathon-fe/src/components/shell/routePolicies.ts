// Declarative per-portal access rules, extracted from what admin/layout.tsx,
// dashboard/layout.tsx, and mentor/layout.tsx each hand-rolled independently.
// AccessGate reads one of these; AppShell picks the policy from `portal`.

export type Portal = "admin" | "dashboard" | "mentor";

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
export const ROLE_DENIED_ROUTES: Record<string, string[]> = {
  Mentor: ["/dashboard/teams", "/dashboard/submissions", "/dashboard/matchmaking"],
};

/**
 * True when any of the user's roles is denied this path. A user holding several
 * roles is denied only if *every* role is denied it, so an Admin-and-Mentor
 * account keeps full access.
 */
export function isRouteDeniedForRoles(pathname: string, roles: string[] | undefined): boolean {
  if (!roles || roles.length === 0) return false;

  return roles.every((role) => {
    const denied = ROLE_DENIED_ROUTES[role];
    if (!denied) return false;
    return denied.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  });
}

/**
 * Where a user lands when they sign in without an explicit `?redirect=`.
 * Mentors do not compete, so they go straight to their own portal instead of
 * the participant dashboard — otherwise nothing in the UI ever leads them there.
 * Admin wins over Mentor because /admin is a superset of both.
 */
export function getRoleLandingPath(roles: string[] | undefined): string {
  if (!roles) return "/dashboard";
  if (roles.includes("Admin")) return "/admin";
  if (roles.includes("Mentor")) return "/mentor";
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
  mentor: {
    allowedRoles: ["Mentor", "Admin"],
    redirectUnauthenticatedTo: (pathname) => `/auth/login?redirect=${encodeURIComponent(pathname)}`,
    redirectUnauthorizedTo: "/dashboard",
    loadingLabel: "Verifying access...",
  },
};
