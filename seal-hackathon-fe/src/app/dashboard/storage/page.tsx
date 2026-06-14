"use client";
import Link from "next/link";
import { Cloud, FileText } from "lucide-react";

// The previous version showed hardcoded fake S3/PostgreSQL/Redis usage stats.
// Until a real storage-metrics API exists, be upfront about it and point users
// to the working Documents library instead.
export default function StoragePage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cloud Storage</h1>
          <p className="page-subtitle">System storage usage and quotas</p>
        </div>
      </div>

      <div className="empty-state">
        <Cloud size={48} className="empty-icon" />
        <div className="empty-title">Storage metrics coming soon</div>
        <div className="empty-desc">
          Live storage usage requires backend integration that is not available yet.
          Files you upload are managed in the Documents library.
        </div>
        <Link href="/dashboard/documents" style={{ marginTop: "1rem" }}>
          <button className="btn btn-primary"><FileText size={15} /> Open Documents</button>
        </Link>
      </div>
    </div>
  );
}
