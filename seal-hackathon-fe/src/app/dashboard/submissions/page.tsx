import { redirect } from "next/navigation";

// Merged into the dashboard workspace — kept as a redirect so old links keep working.
export default function DashboardTabRedirect() {
  redirect("/dashboard?tab=submissions");
}
