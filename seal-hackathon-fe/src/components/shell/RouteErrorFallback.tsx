"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

interface RouteErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Where "leave this page" should take the user, e.g. "/dashboard". */
  homeHref?: string;
  homeLabel?: string;
}

/**
 * Shared fallback for Next.js route error boundaries (error.tsx files).
 * Rendered inside the segment's layout, so the app shell stays usable —
 * the user can retry the failed segment or navigate away without a reload.
 */
export default function RouteErrorFallback({
  error,
  reset,
  homeHref = "/",
  homeLabel = "Back to home",
}: RouteErrorFallbackProps) {
  return (
    <div className="glass-card" style={{ maxWidth: 480, margin: "4rem auto", textAlign: "center" }}>
      <div
        aria-hidden
        style={{
          width: 48,
          height: 48,
          margin: "0 auto 1rem",
          borderRadius: "var(--radius-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(244, 63, 94, 0.12)",
          color: "var(--color-rose)",
        }}
      >
        <AlertTriangle size={24} />
      </div>
      <h2 style={{ fontSize: "1.15rem", marginBottom: "0.4rem" }}>This page hit a problem</h2>
      <p style={{ color: "var(--color-text-2)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
        The rest of the app is still working. You can retry this page, or head back and try again later.
      </p>
      {error.digest && (
        <p style={{ color: "var(--color-text-3)", fontSize: "0.75rem", marginBottom: "1rem" }}>
          Error reference: {error.digest}
        </p>
      )}
      <div style={{ display: "flex", gap: "0.6rem", justifyContent: "center" }}>
        <button className="btn btn-primary btn-sm" onClick={reset} type="button">
          <RotateCcw size={14} /> Try again
        </button>
        <Link href={homeHref} className="btn btn-secondary btn-sm">
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
