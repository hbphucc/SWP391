"use client";

import RouteErrorFallback from "@/components/shell/RouteErrorFallback";

export default function RootError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} homeHref="/" homeLabel="Back to home" />;
}
