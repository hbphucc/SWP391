"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronLeft, LogOut, Menu, Trophy } from "lucide-react";
import styles from "./Sidebar.module.css";
import { useAuth } from "./AuthProvider";
import { getVisibleNav } from "./shell/navigationConfig";
import type { Portal } from "./shell/routePolicies";

interface SidebarProps {
  portal: Portal;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({
  portal,
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user: currentUser, logout } = useAuth();

  const [avatar, setAvatar] = useState<string | null>(null);

  // Avatar is a UI-only per-email preference; never drives identity/authz.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!currentUser) {
        setAvatar(null);
      } else {
        setAvatar(localStorage.getItem(`avatar_${currentUser.email}`));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleLogout = async () => {
    // Capture role BEFORE logout — once logout() resolves, currentUser is null.
    // Admins land on the public landing page; non-admins go back to login so
    // they can hop back into their dashboard quickly.
    const wasAdmin = currentUser?.roles.includes("Admin") ?? false;
    await logout();
    router.push(wasAdmin ? "/" : "/auth/login");
  };

  const userRoles = currentUser?.roles?.length
    ? currentUser.roles
    : currentUser?.role
      ? [currentUser.role]
      : [];

  const visibleSections = getVisibleNav(portal, userRoles);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/admin") return pathname === "/admin";

    return pathname.startsWith(href);
  };

  if (!currentUser) return null;

  const profileHref = currentUser.roles?.includes("Admin")
    ? "/admin/profile"
    : "/dashboard/profile";

  const displayName =
    currentUser.name ||
    currentUser.fullName ||
    currentUser.email ||
    "User";

  return (
    <>
      {mobileOpen && (
        <div className={styles.overlay} onClick={onMobileClose} />
      )}

      <aside
        className={`${styles.sidebar} ${collapsed ? styles.collapsed : ""} ${
          mobileOpen ? styles.mobileOpen : ""
        }`}
      >
        <div
          className={styles.logo}
          style={
            collapsed
              ? { justifyContent: "center", padding: "1.25rem 0" }
              : {}
          }
        >
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

          <button
            className={styles.collapseBtn}
            onClick={onToggle}
            style={collapsed ? { margin: 0, padding: "0.5rem" } : {}}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <Menu size={18} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {visibleSections.map((section) => (
            <div key={section.title} className={styles.section}>
              {!collapsed && (
                <span className={styles.sectionTitle}>{section.title}</span>
              )}

              {section.items.map((item) => {
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

        <div className={styles.footer}>
          <Link
            href={profileHref}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              flex: 1,
              textDecoration: "none",
              minWidth: 0,
              overflow: "hidden",
            }}
          >
            <div className={styles.userAvatar}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  className="avatar-placeholder"
                  style={{
                    width: 36,
                    height: 36,
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  {displayName.charAt(0)}
                </div>
              )}
            </div>

            {!collapsed && (
              <div
                className={styles.userInfo}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                }}
              >
                <span
                  className={styles.userName}
                  style={{
                    color: "var(--color-text)",
                    display: "block",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {displayName}
                </span>

                <span
                  className={styles.userRole}
                  style={{
                    display: "block",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {currentUser.role || currentUser.roles?.[0]}
                </span>
              </div>
            )}
          </Link>

          <button
            className={styles.logoutBtn}
            title="Logout"
            aria-label="Logout"
            onClick={handleLogout}
            style={{ flexShrink: 0 }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
