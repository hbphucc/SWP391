import { redirect } from "next/navigation";

// The mentor portal was folded into the dashboard so that someone holding both
// Mentor and Judge sees one sidebar instead of two. Kept as a redirect because
// this was a mentor's landing page and will be sitting in bookmarks.
export default function MentorPortalRedirect() {
  redirect("/dashboard/mentor");
}
