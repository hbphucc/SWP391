import { redirect } from "next/navigation";

// There was never a separate mentor document library — this route re-exported the
// dashboard one, which already scopes its list to the mentor's assigned teams.
export default function MentorDocumentsRedirect() {
  redirect("/dashboard/documents");
}
