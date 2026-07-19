"use client";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { Bell } from "lucide-react";
import { apiRequest } from "@/lib/api";
import styles from "@/components/settings/SettingsPage.module.css";

type NotificationPreferences = {
  emailNotificationsEnabled: boolean;
};

const PREFERENCES_KEY = ["notification-preferences"];

export default function NotificationPreferencesCard() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();

  const {
    data: preferences = { emailNotificationsEnabled: true },
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: () => apiRequest<NotificationPreferences>("/Auth/notification-preferences"),
  });

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load notification preferences.");
  }, [error, message]);

  // Optimistically flip the toggle, roll back on failure — same UX as before,
  // now with the cache as the single source of truth.
  const { mutate: updateEmailPreference, isPending: saving } = useMutation({
    mutationFn: (enabled: boolean) =>
      apiRequest<NotificationPreferences>("/Auth/notification-preferences", {
        method: "PUT",
        body: JSON.stringify({ emailNotificationsEnabled: enabled }),
      }),
    onMutate: async (enabled) => {
      await queryClient.cancelQueries({ queryKey: PREFERENCES_KEY });
      const previous = queryClient.getQueryData<NotificationPreferences>(PREFERENCES_KEY);
      queryClient.setQueryData<NotificationPreferences>(PREFERENCES_KEY, { emailNotificationsEnabled: enabled });
      return { previous };
    },
    onError: (err, _enabled, context) => {
      if (context?.previous) queryClient.setQueryData(PREFERENCES_KEY, context.previous);
      message.error(err instanceof Error ? err.message : "Could not save notification preferences.");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
      message.success("Notification preferences saved.");
    },
  });

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
