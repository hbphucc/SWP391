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
