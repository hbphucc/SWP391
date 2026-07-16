"use client";
import Link from "next/link";
import { Bell, User } from "lucide-react";
import NotificationPreferencesCard from "@/components/settings/NotificationPreferencesCard";
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

      <NotificationPreferencesCard />

    </div>
  );
}
