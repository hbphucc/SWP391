"use client";
import Link from "next/link";
import { Lock, SunMoon, User } from "lucide-react";
import NotificationPreferencesCard from "@/components/settings/NotificationPreferencesCard";
import styles from "@/components/settings/SettingsPage.module.css";

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

      <NotificationPreferencesCard />
    </div>
  );
}
