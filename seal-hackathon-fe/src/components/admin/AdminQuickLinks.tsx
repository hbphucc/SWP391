import Link from "next/link";
import { Calendar, FileText, Shield } from "lucide-react";

// Static shortcut cards — no props, so no memoization needed.
export default function AdminQuickLinks() {
  return (
    <div className="grid-3" style={{ marginBottom: "2rem" }}>
      <Link href="/admin/events" className="stat-card" style={{ textDecoration: "none" }}>
        <div className="stat-icon" style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-primary)" }}><Calendar size={24} /></div>
        <div>
          <div className="stat-value">Events</div>
          <div className="stat-label">Create and manage events</div>
        </div>
      </Link>
      <Link href="/admin/events?tab=criteria" className="stat-card" style={{ textDecoration: "none" }}>
        <div className="stat-icon" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}><FileText size={24} /></div>
        <div>
          <div className="stat-value">Criteria Templates</div>
          <div className="stat-label">Configure scoring rubrics</div>
        </div>
      </Link>
      <Link href="/admin/system-notifications" className="stat-card" style={{ textDecoration: "none" }}>
        <div className="stat-icon" style={{ background: "rgba(244,63,94,0.15)", color: "#f43f5e" }}><Shield size={24} /></div>
        <div>
          <div className="stat-value">System Notifications</div>
          <div className="stat-label">Broadcast announcements to users</div>
        </div>
      </Link>
    </div>
  );
}
