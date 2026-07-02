"use client";

import React from "react";

export interface StatCardItem {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  /** CSS color for the icon accent, defaults to the primary color. */
  color?: string;
}

export default function StatCardRow({ items }: { items: StatCardItem[] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "2rem",
      }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const color = item.color ?? "var(--color-primary)";
        return (
          <div key={item.label} className="stat-card">
            <div
              className="stat-icon"
              style={{ background: "rgba(99,102,241,0.15)", color }}
            >
              <Icon size={24} />
            </div>
            <div>
              <div className="stat-value">{item.value}</div>
              <div className="stat-label">{item.label}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
