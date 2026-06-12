"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// This route used to show hardcoded fake alerts. Real notifications (including
// admin broadcasts) already live on the notifications page, so redirect there.
export default function SystemNotificationsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/notifications");
  }, [router]);

  return null;
}
