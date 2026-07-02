"use client";

import React, { Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface WorkspaceTab {
  id: string;
  label: string;
  icon?: React.ElementType;
  /** Optional count badge shown next to the label (e.g. pending invitations). */
  badge?: number;
  render: () => React.ReactNode;
}

interface WorkspaceTabsProps {
  tabs: WorkspaceTab[];
  /** Falls back to the first tab when the URL has no valid ?tab= value. */
  defaultTab?: string;
}

function WorkspaceTabsInner({ tabs, defaultTab }: WorkspaceTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fallback = defaultTab ?? tabs[0]?.id ?? "";
  const requested = searchParams.get("tab");
  const active = tabs.some((t) => t.id === requested) ? (requested as string) : fallback;

  // Panels stay mounted once visited so switching back doesn't refetch,
  // but tabs never visited don't fire their API calls at all.
  // State is adjusted during render (not in an effect) per React guidance.
  const [visited, setVisited] = useState<string[]>(() => [active]);
  if (!visited.includes(active)) {
    setVisited([...visited, active]);
  }
  const mounted = visited.includes(active) ? visited : [...visited, active];

  const selectTab = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div>
      <div
        role="tablist"
        style={{
          display: "flex",
          gap: "0.5rem",
          flexWrap: "wrap",
          borderBottom: "1px solid var(--color-border, rgba(255,255,255,0.08))",
          paddingBottom: "0.75rem",
          marginBottom: "1.5rem",
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              className={`btn btn-sm ${isActive ? "btn-primary" : "btn-secondary"}`}
              onClick={() => selectTab(tab.id)}
            >
              {Icon && <Icon size={14} style={{ marginRight: 6 }} />}
              {tab.label}
              {typeof tab.badge === "number" && tab.badge > 0 && (
                <span className="badge badge-warning" style={{ marginLeft: 6 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tabs
        .filter((tab) => mounted.includes(tab.id))
        .map((tab) => (
          <div key={tab.id} role="tabpanel" hidden={tab.id !== active}>
            {tab.render()}
          </div>
        ))}
    </div>
  );
}

export default function WorkspaceTabs(props: WorkspaceTabsProps) {
  // useSearchParams requires a Suspense boundary during prerendering.
  return (
    <Suspense fallback={null}>
      <WorkspaceTabsInner {...props} />
    </Suspense>
  );
}
