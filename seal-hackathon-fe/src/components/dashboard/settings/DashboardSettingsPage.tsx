"use client";
import Link from "next/link";
import { User, Lock, Bell, SunMoon } from "lucide-react";
import styles from "@/components/settings/SettingsPage.module.css";

// Honest settings page: it only lists what actually works today and points
// to the real flows (profile/password live on the Profile page, theme lives
// in the top bar). Server-side preferences are clearly marked as coming soon
// instead of pretending to save.
export default function SettingsPage() {
  return (
    <div className={styles.root}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
        </div>
      </div>

      <div className={`glass-card ${styles.cardSpacing}`}>
        <h3 className={styles.title}>
          <User size={18} className={styles.primaryIcon} /> Account
        </h3>
        <p className={styles.body}>
          Your name, avatar, developer profile, and password are managed on your profile page.
        </p>
        <Link href="/dashboard/profile">
          <button className="btn btn-primary"><Lock size={15} /> Open Profile &amp; Password</button>
        </Link>
      </div>

      <div className={`glass-card ${styles.cardSpacing}`}>
        <h3 className={styles.title}>
          <SunMoon size={18} className={styles.primaryIcon} /> Appearance
        </h3>
        <p className={`${styles.body} ${styles.bodyTight}`}>
          Switch between dark and light mode with the sun/moon button in the top bar.
          Your choice is remembered on this device.
        </p>
      </div>

      <div className="glass-card">
        <h3 className={styles.title}>
          <Bell size={18} className={styles.primaryIcon} /> Email Notifications
          <span className={`badge badge-neutral ${styles.soonBadge}`}>Coming soon</span>
        </h3>
        <p className={styles.body}>
          Per-event email preferences are not available yet. In-app notifications are always on —
          check the bell icon in the top bar.
        </p>
        <div className={styles.disabledList}>
          {["Team invitations", "Event updates", "Submission results"].map(item => (
            <label key={item} className={styles.disabledItem}>
              <input type="checkbox" disabled className={styles.checkbox} />
              <span>{item}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
