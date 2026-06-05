"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  LayoutDashboard, Calendar, Users, FileText, Trophy,
  Settings, ChevronLeft, LogOut, BookOpen,
  Cloud, Tag, Target, Send, Star, Shield, Menu, Search
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { clearAuthSession } from "@/lib/api";

const ALL_NAV_SECTIONS = [
  {
    title: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       href: "/dashboard", roles: null },
    ],
  },
  {
    title: "Events",
    items: [
      { icon: Calendar, label: "Events",    href: "/dashboard/events",       roles: null },
      { icon: Tag,      label: "Tracks",    href: "/dashboard/tracks",       roles: null },
      { icon: Users,    label: "Teams",     href: "/dashboard/teams",        roles: null },
      { icon: Search,   label: "Matchmaking", href: "/dashboard/matchmaking", roles: null },
      { icon: Send,     label: "Submissions", href: "/dashboard/submissions", roles: null },
    ],
  },
  {
    title: "Judging",
    items: [
      { icon: FileText,label: "Criteria",  href: "/dashboard/criteria",     roles: null },
      { icon: Target,  label: "Scoring",   href: "/dashboard/judging",      roles: ["Judge", "Admin"] },
      { icon: Trophy,  label: "Rankings",  href: "/dashboard/rankings",     roles: null },
      { icon: Star,    label: "Prizes",    href: "/dashboard/prizes",       roles: null },
    ],
  },
  {
    title: "Content",
    items: [
      { icon: FileText, label: "Documents", href: "/dashboard/documents",   roles: null },
      { icon: Cloud,    label: "Storage",   href: "/dashboard/storage",     roles: null },
      { icon: BookOpen, label: "Analytics", href: "/dashboard/analytics",   roles: null },
    ],
  },
  {
    title: "System",
    items: [
      { icon: Users,    label: "User Approvals", href: "/dashboard/users",               roles: null },
      { icon: Shield,   label: "System Alerts",  href: "/dashboard/system-notifications", roles: null },
      { icon: Settings, label: "Settings",        href: "/dashboard/settings",            roles: null },
    ],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdminPortal = pathname.startsWith("/admin");
  
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return { name: "Hải Trần", role: "Member", email: "hai@student.fpt.edu.vn" };
  });

  const [avatar, setAvatar] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      let email = "hai@student.fpt.edu.vn";
      if (stored) {
        try {
          email = JSON.parse(stored).email || email;
        } catch {}
      }
      return localStorage.getItem(`avatar_${email}`);
    }
    return null;
  });

  const loadUser = useCallback(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setAvatar(localStorage.getItem(`avatar_${parsed.email}`));
      } catch {}
    } else {
      const defaultUser = { name: "Hải Trần", role: "Member", email: "hai@student.fpt.edu.vn" };
      setCurrentUser(defaultUser);
      setAvatar(localStorage.getItem(`avatar_${defaultUser.email}`));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, [loadUser]);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/login");
  };
  const userRoles: string[] = Array.isArray(currentUser?.roles)
    ? (currentUser.roles as string[])
    : currentUser?.role
      ? [currentUser.role as string]
      : [];

  const visibleSections = ALL_NAV_SECTIONS.map(section => {
    if (isAdminPortal) {
      if (section.title === "Main") return { ...section, items: [{ icon: LayoutDashboard, label: "Admin Dashboard", href: "/admin", roles: null }] };
      if (section.title === "Events") return { ...section, items: [{ icon: Calendar, label: "Events", href: "/admin/events", roles: null }] };
      if (section.title === "System") return { ...section, items: [
        { icon: Users, label: "User Approvals", href: "/admin/users", roles: null },
        { icon: Shield, label: "System Alerts", href: "/admin/system-notifications", roles: null },
        { icon: Settings, label: "Settings", href: "/admin/settings", roles: null }
      ]};
      if (section.title === "Judging") return { ...section, items: [{ icon: FileText, label: "Criteria", href: "/admin/criteria", roles: null }] };
      return null;
    } else if (pathname.startsWith("/mentor")) {
      if (section.title === "Main") return { ...section, items: [{ icon: LayoutDashboard, label: "Mentor Dashboard", href: "/mentor", roles: null }] };
      if (section.title === "Events") return { ...section, items: [{ icon: Users, label: "My Teams", href: "/mentor/teams", roles: null }] };
      return null;
    } else {
      const filteredItems = section.items.filter(item => {
        if (item.label === "Settings" && section.title === "System") return true;
        if (section.title === "System" && item.label !== "Settings") return false;
        if (section.title === "Judging" && item.label === "Criteria") return false;
        if (item.roles && !item.roles.some(r => userRoles.includes(r))) return false;
        return true;
      });
      return { ...section, items: filteredItems };
    }
  }).filter(section => section && section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={onMobileClose} />
      )}

      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${mobileOpen ? styles.mobileOpen : ""}`}>
        {/* Logo */}
        <div className={styles.logo} style={collapsed ? { justifyContent: "center", padding: "1.25rem 0" } : {}}>
          {!collapsed && (
            <>
              <div className={styles.logoIcon}>
                <Trophy size={20} />
              </div>
              <div className={styles.logoText}>
                <span className={styles.logoName}>SEAL</span>
                <span className={styles.logoSub}>Hackathon Hub</span>
              </div>
            </>
          )}
          <button className={styles.collapseBtn} onClick={onToggle} style={collapsed ? { margin: 0, padding: '0.5rem' } : {}}>
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {visibleSections.map((section) => (
            <div key={section!.title} className={styles.section}>
              {!collapsed && (
                <span className={styles.sectionTitle}>{section!.title}</span>
              )}
              {section!.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${active ? styles.active : ""}`}
                    onClick={onMobileClose}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className={styles.navIcon}>
                      <Icon size={18} />
                    </span>
                    {!collapsed && (
                      <span className={styles.navLabel}>{item.label}</span>
                    )}
                    {active && <span className={styles.activeBar} />}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className={styles.footer}>
          <Link href="/dashboard/profile" style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, textDecoration: "none", minWidth: 0, overflow: "hidden" }}>
            <div className={styles.userAvatar}>
              {avatar ? (
                <img src={avatar} alt="Avatar" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: "0.85rem", textTransform: 'uppercase' }}>
                  {currentUser.name.charAt(0)}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className={styles.userInfo} style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
                <span className={styles.userName} style={{ color: "var(--color-text)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.name}</span>
                <span className={styles.userRole} style={{ display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{currentUser.role}</span>
              </div>
            )}
          </Link>
          <button className={styles.logoutBtn} title="Logout" onClick={handleLogout} style={{ flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
