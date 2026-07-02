import { redirect } from "next/navigation";

// Merged into the Events workspace — kept as a redirect so old links keep working.
export default function AdminTracksRedirect() {
  redirect("/admin/events?tab=tracks");
}
