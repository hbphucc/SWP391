"use client";
import React, { useEffect, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Cloud, HardDrive, FileText, Image as ImageIcon, FileArchive, FileCode, FileQuestion, RefreshCw, ChevronRight } from "lucide-react";
import { App } from "antd";
import { apiRequest } from "@/lib/api";
import styles from "./DashboardStoragePage.module.css";

interface StorageCategory {
  name: string;
  size: number;
  percentage: number;
}

interface StorageStats {
  totalSize: number;
  totalCount: number;
  quotaBytes: number;
  usedPercentage: number;
  categories: StorageCategory[];
}

function formatSize(bytes: number) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + " KB";
  return bytes + " B";
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "Images": ImageIcon,
  "PDFs": FileText,
  "Archives": FileArchive,
  "Code & Text": FileCode,
  "Others": FileQuestion,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Images": "var(--color-emerald)", // Emerald
  "PDFs": "var(--color-cyan)", // Teal
  "Archives": "var(--color-amber)", // Amber
  "Code & Text": "var(--color-violet)", // Purple
  "Others": "#64748b", // Slate
};

export default function StoragePage() {
  const { message } = App.useApp();
  const {
    data: stats = null,
    isLoading: loading,
    error,
    refetch: loadStats,
  } = useQuery({
    queryKey: ["storage-stats"],
    queryFn: () => apiRequest<StorageStats>("/Documents/storage-stats"),
  });

  useEffect(() => {
    if (error) message.error(error instanceof Error ? error.message : "Could not load storage stats.");
  }, [error, message]);

  if (loading) {
    return (
      <div className="empty-state">
        <span className="spinner" />
        <div className="empty-title">Calculating storage usage</div>
      </div>
    );
  }

  const totalUsed = stats?.totalSize ?? 0;
  const totalQuota = stats?.quotaBytes ?? 250 * 1024 * 1024;
  const remaining = Math.max(0, totalQuota - totalUsed);
  const usedPercent = stats?.usedPercentage ?? 0;

  return (
    <div className={styles.root}>
      <div className={`page-header ${styles.header}`}>
        <div>
          <h1 className={`page-title ${styles.title}`}>
            <Cloud size={28} /> Cloud Storage
          </h1>
        </div>
        <button className="btn btn-secondary btn-icon" onClick={() => loadStats()} disabled={loading} title="Refresh Statistics">
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Main Quota Card */}
      <div className={`glass-card ${styles.card}`}>
        <div className={styles.cardTitle}>
          <HardDrive size={20} className={styles.primaryIcon} />
          <h3 className={styles.heading}>Storage Quota</h3>
        </div>

        <div className={styles.quotaRow}>
          <span className={styles.quotaText}>
            <strong className={styles.quotaValue}>
              {formatSize(totalUsed)}
            </strong>{" "}
            of {formatSize(totalQuota)} used
          </span>
          <span className={styles.quotaPercent}>
            {usedPercent.toFixed(1)}%
          </span>
        </div>

        {/* Multi-segment/standard progress bar */}
        <div className={`progress ${styles.quotaProgress}`}>
          {stats && stats.categories.length > 0 ? (
            <div className={styles.segments}>
              {stats.categories.map((cat) => {
                const color = CATEGORY_COLORS[cat.name] || "var(--color-primary)";
                // Convert category percentage relative to the overall quota
                const quotaPercent = (cat.size / totalQuota) * 100;
                if (quotaPercent <= 0) return null;
                return (
                  <div
                    key={cat.name}
                    className={styles.segment}
                    style={{ "--segment-width": `${quotaPercent}%`, "--segment-color": color } as CSSProperties}
                    title={`${cat.name}: ${formatSize(cat.size)} (${cat.percentage.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
          ) : (
            <div className={`progress-fill ${styles.fallbackProgress}`} style={{ "--progress-width": `${Math.min(100, usedPercent)}%` } as CSSProperties} />
          )}
        </div>

        {/* Stats Grid */}
        <div className={`grid-3 ${styles.statGrid}`}>
          <div className={styles.miniStat}>
            <div className={styles.miniStatLabel}>Total Files</div>
            <div className={styles.miniStatValue}>{stats?.totalCount ?? 0}</div>
          </div>
          <div className={styles.miniStat}>
            <div className={styles.miniStatLabel}>Available Quota</div>
            <div className={styles.miniStatValue}>{formatSize(remaining)}</div>
          </div>
          <div className={styles.miniStat}>
            <div className={styles.miniStatLabel}>File Limit</div>
            <div className={styles.miniStatValue}>10 MB / File</div>
          </div>
        </div>
      </div>

      {/* Categories breakdown & manage link */}
      <div className={`glass-card ${styles.breakdownCard}`}>
        <h3 className={styles.breakdownTitle}>Storage Breakdown</h3>
        
        <div className={styles.categoryStack}>
          {stats?.categories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.name] || FileQuestion;
            const color = CATEGORY_COLORS[cat.name] || "var(--color-primary)";
            return (
              <div key={cat.name} className={styles.categoryRow}>
                <div className={styles.categoryIcon} style={{ "--category-bg": `${color}15`, "--category-color": color } as CSSProperties}>
                  <Icon size={18} />
                </div>
                <div className={styles.categoryBody}>
                  <div className={styles.categoryHeader}>
                    <span className={styles.categoryName}>{cat.name}</span>
                    <span className={styles.categorySize}>
                      {formatSize(cat.size)} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={`progress ${styles.categoryProgress}`}>
                    <div className={`progress-fill ${styles.categoryProgressFill}`} style={{ "--progress-width": `${cat.percentage}%`, "--category-color": color } as CSSProperties} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span className={styles.footerText}>
            Need to free up space? You can delete your uploaded files anytime.
          </span>
          <Link href="/dashboard/documents">
            <button className={`btn btn-primary btn-sm ${styles.manageButton}`}>
              Manage Documents <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
