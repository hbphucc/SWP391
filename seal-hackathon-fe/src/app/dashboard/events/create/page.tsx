"use client";

// Deprecated route. The Admin Events page (/admin/events) is now the single
// source of truth for event creation — it has the inline Track-catalog picker,
// the inline "Create Track" modal, and sends trackIds atomically. This page
// stays as a redirect so existing inbound links, bookmarks, and history entries
// keep working. Non-admins are bounced to the dashboard (same denial UX as before).

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { fetchCurrentUser, isAuthError } from "@/lib/api";

export default function DeprecatedCreateEventRedirect() {
  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((user) => {
        if (!active) return;
        if (user.roles.includes("Admin")) {
          router.replace("/admin/events?action=create");
        } else {
          message.error("Access denied. Only administrators can create events.");
          router.replace("/dashboard");
        }
      })
      .catch((err) => {
        if (!active) return;
        // A transient network/5xx must not look like an access denial — only an
        // explicit 401/403 means "not logged in" and warrants the auth page.
        if (isAuthError(err)) {
          router.replace("/auth/login");
        } else {
          router.replace("/dashboard");
        }
      });

    return () => { active = false; };
  }, [router, message]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        flexDirection: "column",
        gap: "1rem",
        color: "var(--color-text-2)",
      }}
      aria-live="polite"
    >
      <span className="spinner" />
      Redirecting to the Admin Events workspace…
    </div>
  );
}
