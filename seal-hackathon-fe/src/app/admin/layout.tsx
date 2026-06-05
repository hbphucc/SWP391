"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import styles from "../dashboard/layout.module.css";
import { App } from "antd";
import { clearAuthSession, fetchCurrentUser } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const { message } = App.useApp();

  useEffect(() => {
    let active = true;

    fetchCurrentUser()
      .then((user) => {
        if (!active) return;
        if (!user.roles.includes("Admin")) {
          message.error("Access denied. Admin privileges required.");
          router.push("/dashboard");
        }
      })
      .catch(() => {
        if (!active) return;
        clearAuthSession();
        router.push("/admin/login");
      });

    return () => {
      active = false;
    };
  }, [router, message]);

  return (
    <div className={styles.shell}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <TopBar
        onMenuToggle={() => setMobileOpen(!mobileOpen)}
        sidebarCollapsed={collapsed}
      />
      <main
        className={styles.main}
        style={{
          marginLeft: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
          paddingTop: "var(--topbar-height)",
        }}
      >
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}

