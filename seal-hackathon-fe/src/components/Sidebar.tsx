"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Calendar, Users, FileText, Trophy, BarChart3,
  Bell, Settings, ChevronLeft, ChevronRight, LogOut, BookOpen,
  Cloud, Tag, Target, Send, Star, Shield, Menu, X, Search
} from "lucide-react";
import styles from "./Sidebar.module.css";
import { clearAuthSession } from "@/lib/api";

const NAV_SECTIONS = [
  {
    title: "Chính",
    items: [
      { icon: LayoutDashboard, label: "Tổng quan",       href: "/dashboard" },
    ],
  },
  {
    title: "Sự kiện",
    items: [
      { icon: Calendar, label: "Sự kiện",    href: "/dashboard/events" },
      { icon: Tag,      label: "Hạng mục",    href: "/dashboard/tracks" },
      { icon: Users,    label: "Đội thi",     href: "/dashboard/teams" },
      { icon: Search,   label: "Ghép đội", href: "/dashboard/matchmaking" },
      { icon: Send,     label: "Bài nộp", href: "/dashboard/submissions" },
    ],
  },
  {
    title: "Chấm điểm",
    items: [
      { icon: FileText,label: "Tiêu chí",  href: "/dashboard/criteria" },
      { icon: Target,  label: "Chấm điểm",   href: "/dashboard/judging" },
      { icon: Trophy,  label: "Bảng xếp hạng",  href: "/dashboard/rankings" },
      { icon: Star,    label: "Giải thưởng",    href: "/dashboard/prizes" },
    ],
  },
  {
    title: "Nội dung",
    items: [
      { icon: FileText, label: "Tài liệu", href: "/dashboard/documents" },
      { icon: Cloud,    label: "Lưu trữ",   href: "/dashboard/storage" },
      { icon: BookOpen, label: "Phân tích", href: "/dashboard/analytics" },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      { icon: Users,    label: "Duyệt người dùng", href: "/dashboard/users" },
      { icon: Shield,   label: "Cảnh báo hệ thống",  href: "/dashboard/system-notifications" },
      { icon: Settings, label: "Cài đặt",        href: "/dashboard/settings" },
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);

  const loadUser = () => {
    const stored = (localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser"));
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setAvatar(localStorage.getItem(`avatar_${parsed.email}`));
      } catch(e){}
    } else {
      setCurrentUser(null);
      setAvatar(null);
    }
  };

  useEffect(() => {
    loadUser();
    window.addEventListener("storage", loadUser);
    return () => window.removeEventListener("storage", loadUser);
  }, []);

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/login");
  };

  const visibleSections = NAV_SECTIONS.map(section => {
    if (isAdminPortal || currentUser?.role === "Admin" || currentUser?.roles?.includes("Admin")) {
      if (section.title === "Chính") return { ...section, items: [{ icon: LayoutDashboard, label: "Tổng quan Admin", href: "/admin" }] };
      if (section.title === "Sự kiện") return { ...section, items: [
        { icon: Calendar, label: "Sự kiện", href: "/admin/events" },
        { icon: Tag,      label: "Hạng mục", href: "/admin/tracks" },
        { icon: Users,    label: "Đội thi", href: "/admin/teams" },
      ] };
      if (section.title === "Chấm điểm") return { ...section, items: [
        { icon: FileText, label: "Tiêu chí", href: "/admin/criteria" },
        { icon: Target,   label: "Phân công", href: "/admin/assignments" },
        { icon: Send,     label: "Chấm điểm", href: "/admin/judging" },
      ] };
      if (section.title === "Hệ thống") return { ...section, items: [
        { icon: Users,    label: "Quản lý Người dùng", href: "/admin/users" },
        { icon: Shield,   label: "Thông báo Hệ thống", href: "/admin/system-notifications" },
        { icon: Settings, label: "Cài đặt Chung", href: "/admin/settings" },
      ] };
      return null;
    } else if (pathname.startsWith("/mentor") || currentUser?.role === "Mentor" || currentUser?.roles?.includes("Mentor")) {
      if (section.title === "Chính") return { ...section, items: [{ icon: LayoutDashboard, label: "Tổng quan Cố vấn", href: "/mentor" }] };
      if (section.title === "Sự kiện") return { ...section, items: [{ icon: Users, label: "Đội thi của tôi", href: "/mentor/teams" }] };
      if (section.title === "Hệ thống") return { ...section, items: [{ icon: Bell, label: "Thông báo", href: "/dashboard/notifications" }] };
      return null;
    } else {
      const role = (currentUser?.role || "").toLowerCase().trim();
      
      // Filter "Sự kiện" section: Judges don't need Matchmaking or Submissions or personal Teams management
      if (section.title === "Sự kiện") {
        if (role.includes("judge")) {
          return { ...section, items: section.items.filter(item => item.label !== "Đội thi" && item.label !== "Ghép đội" && item.label !== "Bài nộp") };
        }
        return section;
      }

      // Filter "Chấm điểm" section: Only Judges (and Admins if they access dashboard) see Judging
      if (section.title === "Chấm điểm") {
        if (!role.includes("judge") && !role.includes("admin")) {
          return { ...section, items: section.items.filter(item => item.label !== "Tiêu chí" && item.label !== "Chấm điểm") };
        }
        return { ...section, items: section.items.filter(item => item.label !== "Tiêu chí") };
      }

      if (section.title === "Hệ thống") return { ...section, items: section.items.filter(item => item.label === "Cài đặt") };
      return section;
    }
  }).filter(section => section && section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  if (!currentUser) return null;

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
          <button className={styles.logoutBtn} title="Đăng xuất" onClick={handleLogout} style={{ flexShrink: 0 }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}

