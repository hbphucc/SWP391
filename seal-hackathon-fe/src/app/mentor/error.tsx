"use client";

import RouteErrorFallback from "@/components/shell/RouteErrorFallback";

export default function MentorError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteErrorFallback {...props} homeHref="/mentor" homeLabel="Back to workspace" />;
}
