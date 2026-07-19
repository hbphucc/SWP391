"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Rocket, X, ArrowRight } from "lucide-react";
import styles from "./DashboardWelcomeHint.module.css";

const STORAGE_KEY = "seal-dashboard-welcome-dismissed";

const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

/**
 * Reads the "dismissed" flag from localStorage in an SSR-safe way.
 * The server snapshot reports dismissed=true so the hint renders nothing
 * until the client hydrates and confirms it's a genuine first visit —
 * no flash for returning users, no hydration mismatch.
 */
function useWelcomeDismissed(): [boolean, () => void] {
  const [, forceReread] = useState(0);

  const getSnapshot = () => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  };
  const getServerSnapshot = () => true;

  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* storage unavailable */
    }
    forceReread((n) => n + 1);
  }, []);

  return [dismissed, dismiss];
}

export default function DashboardWelcomeHint({ isAdmin }: { isAdmin: boolean }) {
  const [dismissed, dismiss] = useWelcomeDismissed();

  if (dismissed) return null;

  return (
    <div className={`glass-card ${styles.hint}`} role="region" aria-label="Getting started">
      <div className={styles.icon}>
        <Rocket size={20} />
      </div>
      <div className={styles.body}>
        <h3 className={styles.title}>
          {isAdmin ? "Welcome to your hackathon control center" : "Welcome to your hackathon home"}
        </h3>
        <p className={styles.text}>
          {isAdmin
            ? "Create an event to start onboarding teams, then track registrations, submissions, and judging — all from this dashboard."
            : "Browse open events, register your team, and submit your work. Your deadlines and activity stay in view here."}
        </p>
      </div>
      <div className={styles.actions}>
        <Link
          href={isAdmin ? "/admin/events?action=create" : "/dashboard/events"}
          onClick={dismiss}
          className="btn btn-primary btn-sm"
        >
          {isAdmin ? "Create your first event" : "Browse events"} <ArrowRight size={14} />
        </Link>
        <button className={styles.dismiss} onClick={dismiss} aria-label="Dismiss welcome message" type="button">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
