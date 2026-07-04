import { Calendar, Clock, Tag, FileText, Award, UserCheck } from "lucide-react";
import { App } from "antd";
import WorkspaceTabs from "@/components/workspace/WorkspaceTabs";
import AdminTracksView from "@/components/admin/tracks/AdminTracksView";
import AdminPrizesView from "@/components/admin/prizes/AdminPrizesView";
import AdminCriteriaView from "@/components/admin/criteria/AdminCriteriaView";
import AdminAssignmentsView from "@/components/admin/assignments/AdminAssignmentsView";
import EventSelectorPanel from "./EventSelectorPanel";
import EventTimeEditor from "./EventTimeEditor";
import EventRoundsTab from "./EventRoundsTab";
import { useAdminEventsData } from "./useAdminEventsData";

type AdminEventsData = ReturnType<typeof useAdminEventsData>;

interface EventListViewProps {
  data: AdminEventsData;
}

export default function EventListView({ data }: EventListViewProps) {
  const { message } = App.useApp();
  const {
    events, selectedEventId, selectEvent, selectedEvent,
    loading, saving, advancingId,
    editingTime, setEditingTime, editForm, setEditForm, updatingEvent, deletingEvent,
    editingRoundId, setEditingRoundId, roundEditForm, setRoundEditForm, deletingRoundId,
    eventHasStarted,
    beginEditTime, handleUpdateEventTime, handleDeleteEvent,
    beginEditRound, handleUpdateRound, handleDeleteRound, handleAdvanceRound,
    handlePublishEvent, handleStartEvent, handleCompleteEvent, handleCancelEvent,
  } = data;

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Calendar size={18} style={{ color: "var(--color-primary)" }} /> Event Pipeline Configuration
      </h3>

      {events.length === 0 && !loading ? (
        <div className="empty-state">
          <Calendar size={48} className="empty-icon" />
          <div className="empty-title">No events found</div>
          <p style={{ color: "var(--color-text-3)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Click <strong>New Event</strong> to create your first hackathon event.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <EventSelectorPanel
            events={events}
            selectedEventId={selectedEventId}
            selectedEvent={selectedEvent}
            onSelectEvent={(id) => { selectEvent(id); setEditingTime(false); setEditingRoundId(""); }}
            loading={loading}
            saving={saving}
            updatingEvent={updatingEvent}
            deletingEvent={deletingEvent}
            onPublish={handlePublishEvent}
            onStart={handleStartEvent}
            onComplete={handleCompleteEvent}
            onCancel={handleCancelEvent}
            onBeginEditTime={beginEditTime}
            onDeleteEvent={handleDeleteEvent}
          />

          {selectedEvent && (
            <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "1.5rem" }}>
              {editingTime && (
                <EventTimeEditor
                  selectedEvent={selectedEvent}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  eventHasStarted={eventHasStarted}
                  updatingEvent={updatingEvent}
                  onCancel={() => setEditingTime(false)}
                  onSave={handleUpdateEventTime}
                />
              )}

              <WorkspaceTabs
                defaultTab="rounds"
                tabs={[
                  {
                    id: "rounds",
                    label: "Rounds",
                    icon: Clock,
                    render: () => (
                      <EventRoundsTab
                        selectedEvent={selectedEvent}
                        editingRoundId={editingRoundId}
                        roundEditForm={roundEditForm}
                        setRoundEditForm={setRoundEditForm}
                        saving={saving}
                        deletingRoundId={deletingRoundId}
                        advancingId={advancingId}
                        loading={loading}
                        onBeginEditRound={beginEditRound}
                        onUpdateRound={handleUpdateRound}
                        onDeleteRound={handleDeleteRound}
                        onAdvanceRound={handleAdvanceRound}
                        onCancelEditRound={() => setEditingRoundId("")}
                        onUploadError={(msg) => message.error(msg)}
                        onUploadSuccess={(msg) => message.success(msg)}
                      />
                    ),
                  },
                  {
                    id: "tracks",
                    label: "Tracks",
                    icon: Tag,
                    render: () => <AdminTracksView eventId={selectedEvent.eventId} />,
                  },
                  {
                    id: "criteria",
                    label: "Criteria",
                    icon: FileText,
                    render: () => (
                      <AdminCriteriaView
                        eventName={selectedEvent.eventName}
                        rounds={selectedEvent.rounds.map((r) => ({ roundId: r.roundId, roundName: r.roundName }))}
                      />
                    ),
                  },
                  {
                    id: "prizes",
                    label: "Prizes",
                    icon: Award,
                    render: () => <AdminPrizesView eventId={selectedEvent.eventId} />,
                  },
                  {
                    id: "assignments",
                    label: "Assignments",
                    icon: UserCheck,
                    render: () => <AdminAssignmentsView eventId={selectedEvent.eventId} />,
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
