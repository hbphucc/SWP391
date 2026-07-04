"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import AccessGate from "./AccessGate";
import { routePolicies, type Portal } from "./routePolicies";
import shellStyles from "./AppShell.module.css";

interface AppShellProps {
  portal: Portal;
  children: React.ReactNode;
}

// Shared Sidebar + TopBar + main shell, gated by the portal's AccessPolicy.
// Replaces the near-identical shell markup previously hand-rolled in
// admin/layout.tsx, dashboard/layout.tsx, and mentor/layout.tsx.
export default function AppShell({ portal, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AccessGate policy={routePolicies[portal]}>
      <div className={shellStyles.shell}>
        <Sidebar
          portal={portal}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <TopBar
          onMenuToggle={() => setMobileOpen((v) => !v)}
          sidebarCollapsed={collapsed}
        />
        <main
          className={shellStyles.main}
          style={{
            marginLeft: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
            paddingTop: "var(--topbar-height)",
          }}
        >
          <div className={shellStyles.content}>{children}</div>
        </main>
      </div>
    </AccessGate>
  );
}
