"use client";

import RouteErrorFallback from "@/components/shell/RouteErrorFallback";

export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} homeHref="/admin" homeLabel="Back to admin" />;
}
