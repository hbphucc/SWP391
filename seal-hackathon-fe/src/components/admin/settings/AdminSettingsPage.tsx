"use client";
import Link from "next/link";
import { Shield, Bell, Globe, User } from "lucide-react";
import styles from "@/components/settings/SettingsPage.module.css";

// Honest admin settings page: there is no backend settings API yet, so the
// previously fake controls (maintenance mode, 2FA, "Save All Changes" toast)
// are presented as planned features instead of silently doing nothing.
export default function AdminSettingsPage() {
  return (
    <div className={styles.adminRoot}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Global Settings</h1>
        </div>
      </div>

      <div className={`glass-card ${styles.cardSpacing}`}>
        <h3 className={styles.title}>
          <User size={18} className={styles.primaryIcon} /> Admin Account
        </h3>
        <p className={styles.body}>
          Your admin name, avatar, and password are managed on your profile page.
        </p>
        <Link href="/admin/profile">
          <button className="btn btn-primary">Open Admin Profile</button>
        </Link>
      </div>

      <div className={`glass-card ${styles.cardSpacing}`}>
        <h3 className={styles.title}>
          <Bell size={18} className={styles.primaryIcon} /> System Broadcasts
        </h3>
        <p className={styles.body}>
          Send announcements to all users from the System Notifications page.
        </p>
        <Link href="/admin/system-notifications">
          <button className="btn btn-secondary">Open System Notifications</button>
        </Link>
      </div>

      <div className="glass-card">
        <h3 className={styles.title}>
          <Globe size={18} className={styles.primaryIcon} /> Platform Configuration
          <span className={`badge badge-neutral ${styles.soonBadge}`}>Coming soon</span>
        </h3>
        <p className={styles.body}>
          Maintenance mode and platform branding require backend support that is not implemented yet.
        </p>
        <div className={styles.disabledList}>
          <label className={styles.disabledItem}>
            <input type="checkbox" disabled className={styles.checkbox} />
            <span>Maintenance mode (lock platform for non-admins)</span>
          </label>
          <label className={styles.disabledItem}>
            <input type="checkbox" disabled className={styles.checkbox} />
            <span><Shield size={13} className={styles.inlineIcon} />Enforce 2FA for all administrators</span>
          </label>
        </div>
      </div>
    </div>
  );
}
