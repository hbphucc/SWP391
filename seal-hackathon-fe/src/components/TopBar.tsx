"use client";
import { useState, useRef, useEffect, useContext, useCallback } from "react";
import { Search, Bell, Menu, Sun, Moon, ChevronDown, Settings, User, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./TopBar.module.css";
import Link from "next/link";
import { ThemeContext } from "./ThemeProvider";
import { apiRequest, clearAuthSession } from "@/lib/api";

interface TopBarProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

type NotificationDto = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function TopBar({ onMenuToggle, sidebarCollapsed }: TopBarProps) {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return { name: "Loading...", role: "Member", email: "" };
  });
  const [avatar, setAvatar] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("currentUser");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return localStorage.getItem(`avatar_${parsed.email}`);
        } catch {}
      }
    }
    return null;
  });
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link: string }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const loadUser = useCallback(() => {
    const stored = localStorage.getItem("currentUser");
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setAvatar(localStorage.getItem(`avatar_${parsed.email}`));
      } catch {}
    } else {
      setCurrentUser({ name: "Loading...", role: "Member", email: "" });
      setAvatar(null);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    const loadNotifications = async () => {
      try {
        setNotifications(await apiRequest<NotificationDto[]>("/notifications"));
      } catch {
        setNotifications([]);
      }
    };

    void loadNotifications();

    const handleStorageChange = () => {
      loadUser();
      void loadNotifications();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadUser]);

  const markAllRead = async () => {
    try {
      await apiRequest("/notifications/read-all", { method: "POST" });
      setNotifications(await apiRequest<NotificationDto[]>("/notifications"));
      window.dispatchEvent(new Event("storage"));
    } catch {
      setNotifications([]);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Giả lập tìm kiếm nhanh
    const results = [];
    const qLower = q.toLowerCase();
    
    // Always provide some dummy data if query > 2 chars to make it feel functional
    if (qLower.includes("team") || qLower.includes("cyb") || qLower.includes("hack")) {
      results.push({ type: "Team", title: `Team ${q} (Match)`, link: "/dashboard/teams/1" });
    }
    if (qLower.includes("event") || qLower.includes("fin")) {
      results.push({ type: "Event", title: "Grand Finale 2026", link: "/dashboard/events/EV-001" });
    }
    if (qLower.includes("track") || qLower.includes("ai")) {
      results.push({ type: "Track", title: "AI/ML Track", link: "/dashboard/tracks" });
    }
    if (results.length === 0) {
      results.push({ type: "Search", title: `Search for "${q}"`, link: "#" });
    }
    
    setSearchResults(results);
  };

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/login");
  };

  return (
    <header
      className={styles.topbar}
      style={{ left: sidebarCollapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)" }}
    >
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="search-bar" style={{ minWidth: 280, position: 'relative' }} ref={searchRef}>
          <Search size={16} style={{ color: "var(--color-text-3)", flexShrink: 0 }} />
          <input 
            className="search-input" 
            placeholder="Search events, teams, documents…" 
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px', zIndex: 100 }}>
              {searchResults.map((res, i) => (
                <Link key={i} href={res.link} className="dropdown-item" onClick={() => { setSearchResults([]); setSearchQuery(""); }}>
                  <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>{res.type}</span>
                  {res.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="dropdown" ref={notifRef}>
          <button
            className={styles.iconBtn}
            onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false); }}
            style={{ position: "relative" }}
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {notifOpen && (
            <div className={`dropdown-menu ${styles.notifPanel}`}>
              <div className={styles.notifHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span className={styles.notifTitle}>Notifications</span>
                  {unreadCount > 0 && <span className="badge badge-primary" style={{ marginLeft: "0.5rem" }}>{unreadCount} new</span>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.75rem", cursor: "pointer" }}>
                    Mark all as read
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
                    No notifications
                  </div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`${styles.notifItem} ${!n.isRead ? styles.unread : ""}`}>
                      <div className={styles.notifDot2} style={{ background: !n.isRead ? "var(--color-primary)" : "transparent" }} />
                      <div className={styles.notifBody}>
                        <span className={styles.notifItemTitle}>{n.title}</span>
                        <span className={styles.notifDesc}>{n.message}</span>
                        <span className={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.notifFooter}>
                <Link href="/dashboard/notifications" onClick={() => setNotifOpen(false)}>
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="dropdown" ref={userRef}>
          <button
            className={styles.userBtn}
            onClick={() => { setUserOpen(!userOpen); setNotifOpen(false); }}
          >
            {avatar ? (
              <img src={avatar} alt="Avatar" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", textTransform: 'uppercase' }}>
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div className={styles.userInfo}>
              <span className={styles.userName}>{currentUser.name}</span>
              <span className={styles.userRole}>{currentUser.role}</span>
            </div>
            <ChevronDown size={14} style={{ color: "var(--color-text-3)" }} />
          </button>

          {userOpen && (
            <div className="dropdown-menu">
              <Link href={currentUser.role === "Admin" ? "/admin/profile" : "/dashboard/profile"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <User size={15} /> View Profile
              </Link>
              <Link href={currentUser.role === "Admin" ? "/admin/settings" : "/dashboard/settings"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <Settings size={15} /> Settings
              </Link>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                <LogOut size={15} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
