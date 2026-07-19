"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User, Save, Upload, Mail, GraduationCap, Phone, Lock, Code2 } from "lucide-react";
import { App } from "antd";
import { CurrentUser, apiRequest, apiUpload, fetchCurrentUser, resolveApiUrl } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { DEVELOPER_ROLES, PROGRAMMING_LANGUAGES } from "@/lib/developerProfile";
import { PASSWORD_PATTERN, PASSWORD_RULE_MESSAGE } from "@/lib/constants";
import styles from "./ProfilePage.module.css";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export default function ProfilePage() {
  const { message } = App.useApp();
  const { refresh } = useAuth();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: loadedUser, isLoading: loading, error } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
  });

  // Seed the editable form once from the server truth; later edits live in local
  // state and the mutations below re-source via AuthProvider.refresh().
  useEffect(() => {
    if (loadedUser && !user) {
      setUser(loadedUser);
      setAvatarUrl(resolveApiUrl(loadedUser.avatarUrl));
    }
  }, [loadedUser, user]);

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load profile.");
  }, [error, message]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await apiRequest<CurrentUser>("/Auth/profile", {
        method: "PUT",
        body: JSON.stringify({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber || null,
          studentCode: user.studentCode || null,
          developerRole: user.developerRole || null,
          programmingLanguages: user.programmingLanguages ?? [],
        }),
      });

      // Re-source from /Auth/me so the local user state never trusts a
      // hand-crafted client object; the cookie-backed server is the truth.
      const refreshed = await refresh();
      if (refreshed) setUser(refreshed);
      message.success("Profile updated successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const toggleLanguage = (language: string) => {
    if (!user) return;
    const current = user.programmingLanguages ?? [];
    const next = current.includes(language)
      ? current.filter((l) => l !== language)
      : [...current, language];
    setUser({ ...user, programmingLanguages: next });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > MAX_AVATAR_BYTES) {
      message.error("Avatar image must be smaller than 2 MB.");
      e.target.value = "";
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const updated = await apiUpload<CurrentUser>("/Auth/avatar", formData);
      const refreshed = await refresh();
      const nextUser = refreshed ?? updated;
      setUser(nextUser);
      setAvatarUrl(resolveApiUrl(nextUser.avatarUrl));
      message.success("Avatar updated successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not upload avatar.");
    } finally {
      setSaving(false);
      e.target.value = "";
    }
  };

  const handleRegisterRole = async (targetRole: "Mentor" | "Judge") => {
    setSaving(true);
    try {
      const endpoint = targetRole === "Mentor" ? "/Auth/request-mentor" : "/Auth/request-judge";
      await apiRequest(endpoint, { method: "POST" });
      message.success(`Successfully submitted request to become a ${targetRole}. Pending admin approval.`);
      const refreshed = await refresh();
      if (refreshed) setUser(refreshed);
    } catch (err) {
      message.error(err instanceof Error ? err.message : `Could not submit request for ${targetRole}.`);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      message.error("Password confirmation does not match.");
      return;
    }

    if (!PASSWORD_PATTERN.test(passwordForm.newPassword)) {
      message.error(PASSWORD_RULE_MESSAGE);
      return;
    }

    setSaving(true);
    try {
      await apiRequest("/Auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      message.success("Password changed successfully.");
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Loading profile</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={`glass-card ${styles.profileCard}`}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className={styles.avatar} />
          ) : (
            <div className={`avatar-placeholder ${styles.avatarPlaceholder}`}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className={styles.name}>{user.fullName}</h3>
            <span className="badge badge-primary">{user.role}</span>
          </div>
          <label className={`btn btn-secondary btn-sm ${styles.uploadLabel}`}>
            <Upload size={14} /> Change Avatar
            <input type="file" accept="image/*" className={styles.hiddenInput} onChange={handleAvatarUpload} />
          </label>

          {user.role === "Member" && (
            <div className={styles.roleActions}>
              {user.requestedRole ? (
                <div className={styles.pendingBox}>
                  <div className={styles.pendingRow}>
                    <span className={`spinner ${styles.smallSpinner}`} />
                    <span className={styles.pendingText}>Pending Admin Approval</span>
                  </div>
                  <span className={styles.pendingMeta}>Requested: {user.requestedRole}</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleRegisterRole("Mentor")}
                    disabled={saving}
                    className={`btn btn-primary btn-sm ${styles.fullButton}`}
                  >
                    Register as Mentor
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRegisterRole("Judge")}
                    disabled={saving}
                    className={`btn btn-secondary btn-sm ${styles.fullButton}`}
                  >
                    Register as Judge
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className={`glass-card ${styles.mainCard}`}>
          <form onSubmit={handleSave} className={styles.formStack}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label"><User size={13} className={styles.labelIcon} /> Full Name</label>
                <input className="form-input" value={user.fullName || ""} onChange={(e) => setUser({ ...user, fullName: e.target.value, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label"><Mail size={13} className={styles.labelIcon} /> Email Address</label>
                <input className="form-input" type="email" value={user.email || ""} disabled />
                <span className="form-hint">Email cannot be changed</span>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label"><Phone size={13} className={styles.labelIcon} /> Phone Number</label>
                <input className="form-input" value={user.phoneNumber || ""} onChange={(e) => setUser({ ...user, phoneNumber: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label"><GraduationCap size={13} className={styles.labelIcon} /> Student Code</label>
                <input className="form-input" value={user.studentCode || ""} onChange={(e) => setUser({ ...user, studentCode: e.target.value })} />
              </div>
            </div>

            <div className={styles.developerSection}>
              <h3 className={styles.sectionTitle}>
                <Code2 size={18} /> Developer Profile
              </h3>
              <p className={styles.sectionDescription}>
                Tell others how you like to build. This is profile information only.
              </p>

              <div className="form-group">
                <label className="form-label">Developer Role</label>
                <select
                  className="form-input"
                  value={user.developerRole || ""}
                  onChange={(e) => setUser({ ...user, developerRole: e.target.value || null })}
                >
                  <option value="">Not specified</option>
                  {DEVELOPER_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Programming Languages &amp; Technologies</label>
                <div className={styles.languageList}>
                  {PROGRAMMING_LANGUAGES.map((language) => {
                    const selected = (user.programmingLanguages ?? []).includes(language);
                    return (
                      <button
                        type="button"
                        key={language}
                        aria-pressed={selected}
                        onClick={() => toggleLanguage(language)}
                        className={`badge ${selected ? "badge-primary" : "badge-neutral"} ${styles.languageButton}`}
                      >
                        {language}
                      </button>
                    );
                  })}
                </div>
                <span className="form-hint">Click to select one or more. Click again to remove.</span>
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className={`glass-card ${styles.passwordCard}`}>
        <form onSubmit={handlePasswordChange} className={styles.formStack}>
          <h3 className={styles.passwordTitle}>
            <Lock size={18} /> Change Password
          </h3>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required />
            </div>
          </div>

          <div className={`form-group ${styles.narrowField}`}>
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required />
          </div>

          <div className={styles.endActions}>
            <button type="submit" className="btn btn-secondary" disabled={saving}>
              Change Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

