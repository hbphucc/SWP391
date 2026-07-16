"use client";
import { useCallback, useEffect, useState } from "react";
import { App } from "antd";
import { Bell } from "lucide-react";
import { apiRequest } from "@/lib/api";
import styles from "@/components/settings/SettingsPage.module.css";

type NotificationPreferences = {
  emailNotificationsEnabled: boolean;
};

export default function NotificationPreferencesCard() {
  const { message } = App.useApp();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotificationsEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadPreferences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<NotificationPreferences>("/Auth/notification-preferences");
      setPreferences(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not load notification preferences.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    void Promise.resolve().then(() => loadPreferences());
  }, [loadPreferences]);

  const updateEmailPreference = async (enabled: boolean) => {
    const previous = preferences;
    setPreferences({ emailNotificationsEnabled: enabled });
    setSaving(true);

    try {
      const data = await apiRequest<NotificationPreferences>("/Auth/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ emailNotificationsEnabled: enabled }),
      });
      setPreferences(data);
      message.success("Notification preferences saved.");
    } catch (err) {
      setPreferences(previous);
      message.error(err instanceof Error ? err.message : "Could not save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`glass-card ${styles.cardSpacing}`}>
      <h3 className={styles.title}>
        <Bell size={18} className={styles.primaryIcon} /> Email Notifications
      </h3>
      <p className={styles.body}>
        Choose whether SEAL should send email updates when an email channel is available. In-app notifications still stay on.
      </p>
      <label className={`${styles.preferenceRow} ${loading ? styles.preferenceRowLoading : ""}`}>
        <span>
          <strong className={styles.preferenceTitle}>Receive email notifications</strong>
          <span className={styles.preferenceDesc}>Team invitations, event updates, and submission results.</span>
        </span>
        <input
          type="checkbox"
          className={styles.switchInput}
          checked={preferences.emailNotificationsEnabled}
          onChange={(event) => updateEmailPreference(event.target.checked)}
          disabled={loading || saving}
          aria-label="Receive email notifications"
        />
      </label>
    </div>
  );
}
