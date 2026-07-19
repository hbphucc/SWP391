"use client";

import RouteErrorFallback from "@/components/shell/RouteErrorFallback";

export default function DashboardError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} homeHref="/dashboard" homeLabel="Back to dashboard" />;
}
