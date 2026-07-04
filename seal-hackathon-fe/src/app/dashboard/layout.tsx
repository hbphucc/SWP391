import AppShell from "@/components/shell/AppShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell portal="dashboard">{children}</AppShell>;
}
