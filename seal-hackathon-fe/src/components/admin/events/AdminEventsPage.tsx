"use client";
import { Plus, RefreshCw } from "lucide-react";
import PageHeader from "@/components/workspace/PageHeader";
import { useAdminEventsData } from "./useAdminEventsData";
import EventListView from "./EventListView";
import CreateEventWizard from "./CreateEventWizard";

export default function AdminEventsPage() {
  const data = useAdminEventsData();
  const { view, setView, setActiveSection, loading, saving, refreshEvents } = data;

  return (
    <div>
      <PageHeader
        title="Event Management"
        subtitle={view === "list"
          ? "Create, publish, and manage competition rounds, tracks, prizes, and judging setup."
          : "Set up the event timeline, rounds, scoring criteria, prizes, and available tracks."}
        actions={(
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            {view === "list" ? (
              <>
                <button className="btn btn-secondary" onClick={() => { void refreshEvents(); }} disabled={loading || saving}>
                  <RefreshCw size={16} /> Refresh
                </button>
                <button className="btn btn-primary" onClick={() => { setView("create"); setActiveSection("general"); }}>
                  <Plus size={16} /> New Event
                </button>
              </>
            ) : (
              <button className="btn btn-secondary" onClick={() => setView("list")}>
                Back to Events
              </button>
            )}
          </div>
        )}
      />

      {view === "list" ? <EventListView data={data} /> : <CreateEventWizard data={data} />}
    </div>
  );
}
