import { Calendar } from "lucide-react";
import CreateEventGeneralSection from "./CreateEventGeneralSection";
import CreateEventRoundsSection from "./CreateEventRoundsSection";
import CreateEventPrizesSection from "./CreateEventPrizesSection";
import CreateEventTracksSection from "./CreateEventTracksSection";
import { useAdminEventsData } from "./useAdminEventsData";

type AdminEventsData = ReturnType<typeof useAdminEventsData>;

interface CreateEventWizardProps {
  data: AdminEventsData;
}

const TOC_ITEMS = [
  { id: "general", label: "General Info" },
  { id: "timeline", label: "Timeline" },
  { id: "rounds", label: "Rounds" },
  { id: "prizes", label: "Prizes" },
  { id: "tracks", label: "Tracks" },
] as const;

export default function CreateEventWizard({ data }: CreateEventWizardProps) {
  const {
    setView,
    eventForm, setEventForm,
    rounds, setRounds, addRound, removeRound,
    prizes, setPrizes, addPrize, removePrize,
    selectedTracks, toggleTrack,
    activeSection, setActiveSection,
    submitting,
    trackCatalog, usingCatalog,
    trackModalOpen, setTrackModalOpen, creatingTrack, trackForm, setTrackForm,
    openTrackModal, handleCreateTrack, handleCreateEvent,
  } = data;

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "200px minmax(0, 1fr)",
      gap: "1.5rem",
      alignItems: "start",
    }}>
      {/* TOC sidebar */}
      <nav
        aria-label="Event sections"
        style={{
          position: "sticky",
          top: 80,
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          paddingTop: "0.5rem",
        }}
      >
        {TOC_ITEMS.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                document.getElementById(`ec-${item.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="btn btn-ghost btn-sm"
              style={{
                justifyContent: "flex-start",
                paddingLeft: "0.85rem",
                borderLeft: active ? "3px solid var(--color-primary)" : "3px solid transparent",
                borderRadius: 0,
                fontWeight: active ? 700 : 500,
                color: active ? "var(--color-text-1)" : "var(--color-text-3)",
                background: active ? "rgba(99,102,241,0.08)" : "transparent",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Sections column */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: 100 }}>
        <section id="ec-general">
          <CreateEventGeneralSection eventForm={eventForm} setEventForm={setEventForm} />
        </section>

        <section id="ec-rounds">
          <CreateEventRoundsSection rounds={rounds} setRounds={setRounds} addRound={addRound} removeRound={removeRound} />
        </section>

        <section id="ec-prizes">
          <CreateEventPrizesSection prizes={prizes} setPrizes={setPrizes} addPrize={addPrize} removePrize={removePrize} />
        </section>

        <section id="ec-tracks">
          <CreateEventTracksSection
            trackCatalog={trackCatalog}
            usingCatalog={usingCatalog}
            selectedTracks={selectedTracks}
            toggleTrack={toggleTrack}
            onOpenTrackModal={openTrackModal}
            trackModalOpen={trackModalOpen}
            setTrackModalOpen={setTrackModalOpen}
            creatingTrack={creatingTrack}
            trackForm={trackForm}
            setTrackForm={setTrackForm}
            onCreateTrack={handleCreateTrack}
          />
        </section>
      </div>

      {/* Sticky bottom action bar — always visible, regardless of which
          section the admin is currently viewing. Spans the full width
          under both TOC and content. */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          background: "var(--color-bg)",
          borderTop: "1px solid var(--color-border)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.6rem",
          boxShadow: "0 -2px 12px rgba(0,0,0,0.2)",
        }}
      >
        <button className="btn btn-secondary" onClick={() => setView("list")} disabled={submitting}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={submitting} onClick={handleCreateEvent}>
          {submitting ? <span className="spinner" /> : <><Calendar size={16} /> Create Event</>}
        </button>
      </div>
    </div>
  );
}
