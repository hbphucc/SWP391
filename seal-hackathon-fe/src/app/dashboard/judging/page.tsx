import { Suspense } from "react";
import JudgingPortalPage from "@/components/judging/JudgingPortalPage";

// The portal reads its event/status filters from the query string so they
// survive scoring a submission and coming back. useSearchParams needs a
// Suspense boundary for this route to keep prerendering statically.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <JudgingPortalPage />
    </Suspense>
  );
}
