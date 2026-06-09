"use client";
import { useState, useRef, useEffect, useContext } from "react";
import { Search, Bell, Menu, Sun, Moon, ChevronDown, Settings, User, LogOut, RefreshCw, Key, Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./TopBar.module.css";
import { ALL_LANGUAGES } from "@/lib/languages";
import Link from "next/link";
import { ThemeContext } from "./ThemeProvider";
import { App, Modal, Input, Dropdown } from "antd";
import { apiRequest, clearAuthSession } from "@/lib/api";

interface TopBarProps {
  onMenuToggle: () => void;
  sidebarCollapsed: boolean;
}

export default function TopBar({ onMenuToggle, sidebarCollapsed }: TopBarProps) {
  const router = useRouter();
  const { message } = App.useApp();
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "Loading...", role: "Member", email: "" });
  const [avatar, setAvatar] = useState<string | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef  = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; link: string }[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [password, setPassword] = useState("");

  const [notifications, setNotifications] = useState<any[]>([]);
  const unreadCount = notifications.filter(n => n.unread).length;

  const loadUser = () => {
    const stored = (localStorage.getItem("currentUser") || sessionStorage.getItem("currentUser"));
    if (stored) {
      try { 
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setAvatar(localStorage.getItem(`avatar_${parsed.email}`));
      } catch(e){}
    } else {
      setCurrentUser(null as any);
      setAvatar(null);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchResults([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    // Load notifications from Backend API
    const loadNotifications = async () => {
      try {
        const data = await apiRequest<any[]>("/SystemNotifications");
        const readNotifs = JSON.parse(localStorage.getItem("readNotifications") || "[]");
        
        const mapped = data.map(n => ({
          id: n.id,
          title: n.title,
          desc: n.message,
          time: new Date(n.createdAt).toLocaleTimeString(),
          unread: !readNotifs.includes(n.id)
        }));
        
        setNotifications(mapped);
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };

    loadNotifications();
    const intervalId = setInterval(loadNotifications, 10000); // Poll every 10 seconds
    loadUser(); // Load user on mount

    const handleStorageChange = () => {
      loadUser();
    };

    window.addEventListener("storage", handleStorageChange);

    // Load saved accounts
    const updateSavedAccounts = () => {
      const savedRaw = localStorage.getItem("seal_saved_accounts");
      if (savedRaw) {
        try { 
          const saved = JSON.parse(savedRaw);
          // Filter out Admin accounts just in case they are still in the storage
          setSavedAccounts(saved.filter((a: any) => a.role !== "Admin" && (!a.roles || !a.roles.includes("Admin"))));
        } catch(e){}
      }
    };
    
    updateSavedAccounts();

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(intervalId);
    };
  }, []);

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    
    // Save read IDs to localStorage
    const readIds = updated.map(n => n.id);
    localStorage.setItem("readNotifications", JSON.stringify(readIds));
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
      results.push({ type: "Trống", title: `Không tìm thấy dữ liệu cho "${q}"`, link: "#" });
    }
    
    setSearchResults(results);
  };

  const handleSwitchAccountSubmit = () => {
    if (!selectedAccount) return;

    if (selectedAccount.remembered && selectedAccount.token) {
      // Instant switch using stored token
      const { token, remembered, ...userProps } = selectedAccount;
      localStorage.setItem("seal_token", token);
      sessionStorage.removeItem("seal_token");
      localStorage.setItem("currentUser", JSON.stringify(userProps));
      sessionStorage.removeItem("currentUser");
      message.success(`Switched to ${selectedAccount.fullName || selectedAccount.email}`);
      window.location.reload();
    } else {
      // Needs password, redirect to login
      router.push(`/auth/login?switch_email=${encodeURIComponent(selectedAccount.email)}`);
    }
  };

  const openSwitchModal = () => {
    setUserOpen(false);
    setSwitchModalOpen(true);
    setSelectedAccount(null);
  };

  const handleLogout = () => {
    clearAuthSession();
    router.push("/auth/login");
  };

  const handleLanguageChange = (langKey: string) => {
    const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (combo) {
      combo.value = langKey;
      combo.dispatchEvent(new Event("change"));
    }
  };

  const languageOptions = ALL_LANGUAGES.map(l => ({ 
    key: l.key, 
    label: <span className="notranslate">{l.label}</span>, 
    onClick: () => handleLanguageChange(l.key) 
  }));

  if (!currentUser) return null;

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
            placeholder="Tìm kiếm đội thi, sự kiện, hạng mục..." 
            value={searchQuery}
            onChange={handleSearch}
          />
          {searchResults.length > 0 && (
            <div className="dropdown-menu" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', marginTop: '8px', zIndex: 100 }}>
              {searchResults.map((res, i) => (
                res.type === "Empty" ? (
                  <div key={i} className="dropdown-item" style={{ color: 'var(--color-text-3)', cursor: 'default' }}>
                    {res.title}
                  </div>
                ) : (
                  <Link key={i} href={res.link} className="dropdown-item" onClick={() => { setSearchResults([]); setSearchQuery(""); }}>
                    <span style={{ fontSize: '0.7rem', background: '#e2e8f0', color: '#475569', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>{res.type}</span>
                    {res.title}
                  </Link>
                )
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.right}>
        {/* Headless Translation Language Dropdown */}
        <Dropdown menu={{ items: languageOptions, style: { maxHeight: "400px", overflowY: "auto" } }} placement="bottomRight" trigger={['click']}>
          <button className={styles.iconBtn} title="Đổi ngôn ngữ">
            <Languages size={18} />
          </button>
        </Dropdown>
        
        {/* Theme toggle */}
        <button className={styles.iconBtn} onClick={toggleTheme} title="Đổi giao diện">
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
                  <span className={styles.notifTitle}>Thông báo</span>
                  {unreadCount > 0 && <span className="badge badge-primary" style={{ marginLeft: "0.5rem" }}>{unreadCount} mới</span>}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.75rem", cursor: "pointer" }}>
                    Đánh dấu đã đọc tất cả
                  </button>
                )}
              </div>
              <div className={styles.notifList}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-3)", fontSize: "0.85rem" }}>
                    Không có thông báo
                  </div>
                ) : (
                  notifications.slice(0, 5).map(n => (
                    <div key={n.id} className={`${styles.notifItem} ${n.unread ? styles.unread : ""}`}>
                      <div className={styles.notifDot2} style={{ background: n.unread ? "var(--color-primary)" : "transparent" }} />
                      <div className={styles.notifBody}>
                        <span className={styles.notifItemTitle}>{n.title}</span>
                        <span className={styles.notifDesc}>{n.desc}</span>
                        <span className={styles.notifTime}>{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className={styles.notifFooter}>
                <Link href="/dashboard/notifications" onClick={() => setNotifOpen(false)}>
                  Xem tất cả thông báo →
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
                <User size={15} /> Xem hồ sơ
              </Link>
              <Link href={currentUser.role === "Admin" ? "/admin/settings" : "/dashboard/settings"} className="dropdown-item" onClick={() => setUserOpen(false)}>
                <Settings size={15} /> Cài đặt
              </Link>
              <button className="dropdown-item" onClick={openSwitchModal} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                <RefreshCw size={15} /> Chuyển tài khoản
              </button>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                <LogOut size={15} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="Chuyển tài khoản"
        open={switchModalOpen}
        onCancel={() => setSwitchModalOpen(false)}
        onOk={handleSwitchAccountSubmit}
        okText={selectedAccount?.remembered ? "Chuyển ngay" : "Tiếp tục"}
        okButtonProps={{ disabled: !selectedAccount }}
      >
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ color: "var(--color-text-2)", marginBottom: "1rem" }}>Chọn một tài khoản để chuyển đổi.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {savedAccounts.length === 0 && (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--color-text-3)", background: "rgba(15,23,42,0.3)", borderRadius: "var(--radius-md)" }}>
                Không có tài khoản nào khác được lưu.
              </div>
            )}
            {savedAccounts.map((acc, idx) => (
              <div 
                key={idx} 
                onClick={() => setSelectedAccount(acc)}
                style={{
                  display: "flex", alignItems: "center", gap: "1rem", padding: "1rem",
                  border: selectedAccount?.email === acc.email ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)", cursor: "pointer",
                  background: selectedAccount?.email === acc.email ? "rgba(99,102,241,0.1)" : "rgba(15,23,42,0.3)"
                }}
              >
                {acc.avatar ? (
                  <img src={acc.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                ) : (
                  <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", textTransform: 'uppercase' }}>
                    {(acc.fullName || acc.email).charAt(0)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{acc.fullName || acc.email} {currentUser.email === acc.email && <span style={{ color: "var(--color-text-3)", fontWeight: 400 }}>(Hiện tại)</span>}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{acc.email}</div>
                </div>
                <div style={{ fontSize: "0.75rem", color: acc.remembered ? "var(--color-emerald)" : "var(--color-text-3)" }}>
                  {acc.remembered ? "Đã đăng nhập" : "Cần mật khẩu"}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            <Link 
              href="/auth/login?add_account=true" 
              className="btn btn-secondary" 
              style={{ width: "100%", padding: "0.75rem", borderStyle: "dashed" }}
              onClick={() => { clearAuthSession(); setSwitchModalOpen(false); }}
            >
              + Đăng nhập vào tài khoản khác
            </Link>
          </div>
        </div>
      </Modal>
    </header>
  );
}

