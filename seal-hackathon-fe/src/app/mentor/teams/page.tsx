import { redirect } from "next/navigation";

// Merged into the mentor workspace, which now lives inside the dashboard.
export default function MentorTeamsRedirect() {
  redirect("/dashboard/mentor");
}
