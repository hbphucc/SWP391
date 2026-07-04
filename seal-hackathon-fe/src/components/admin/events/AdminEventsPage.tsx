"use client";
import { Plus, RefreshCw } from "lucide-react";
import { useAdminEventsData } from "./useAdminEventsData";
import EventListView from "./EventListView";
import CreateEventWizard from "./CreateEventWizard";

export default function AdminEventsPage() {
  const data = useAdminEventsData();
  const { view, setView, setActiveSection, loading, saving, refreshEvents } = data;

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Event Management</h1>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
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
              ← Back to Events
            </button>
          )}
        </div>
      </div>

      {view === "list" ? <EventListView data={data} /> : <CreateEventWizard data={data} />}
    </div>
  );
}
