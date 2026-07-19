"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { App } from "antd";
import { useAuth } from "@/components/AuthProvider";
import ShellLoading from "./ShellLoading";
import { getRoleLandingPath, isRouteDeniedForRoles, type AccessPolicy } from "./routePolicies";

interface AccessGateProps {
  policy: AccessPolicy;
  children: React.ReactNode;
}

// Centralizes the auth/role redirect logic previously duplicated across
// admin/layout.tsx, dashboard/layout.tsx, and mentor/layout.tsx.
export default function AccessGate({ policy, children }: AccessGateProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { message } = App.useApp();
  const { user, isLoading, loggingOut } = useAuth();

  // Two independent gates: the portal-level role check, then a per-route denial
  // for roles that the portal admits but this particular route does not suit.
  const portalAllowed =
    !!user && (policy.allowedRoles === null || policy.allowedRoles.some((r) => user.roles.includes(r)));
  const routeDenied = !!user && isRouteDeniedForRoles(pathname, user.roles);
  const allowed = portalAllowed && !routeDenied;

  useEffect(() => {
    // Skip during logout so the caller's chosen destination wins the race.
    // Skip while AuthProvider is still bootstrapping (isLoading) — only an
    // actual 401/403 sets user to null; a network blip during the initial
    // fetch leaves isLoading true instead, so we don't redirect on it.
    if (loggingOut || isLoading) return;

    if (!user) {
      router.push(policy.redirectUnauthenticatedTo(pathname));
      return;
    }

    // Send a route-denied user home to their own portal rather than to the
    // policy's redirect target, which for the dashboard portal is /dashboard —
    // a path they are standing on, which would loop.
    if (routeDenied) {
      message.error("This section is not available for your role.");
      router.push(getRoleLandingPath(user.roles));
      return;
    }

    if (policy.allowedRoles !== null && !allowed) {
      if (policy.unauthorizedMessage) message.error(policy.unauthorizedMessage);
      router.push(policy.redirectUnauthorizedTo);
    }
  }, [loggingOut, isLoading, user, allowed, routeDenied, pathname, router, policy, message]);

  // Block rendering until access is verified — prevents a flash of protected
  // content for unauthenticated or unauthorized visitors.
  if (isLoading || !user || !allowed) {
    return <ShellLoading label={policy.loadingLabel} />;
  }

  return <>{children}</>;
}
