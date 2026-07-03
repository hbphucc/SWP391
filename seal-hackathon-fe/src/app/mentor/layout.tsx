import AppShell from "@/components/shell/AppShell";

export default function MentorLayout({ children }: { children: React.ReactNode }) {
  return <AppShell portal="mentor">{children}</AppShell>;
}
