import { Calendar } from "lucide-react";
import CreateEventGeneralSection from "./CreateEventGeneralSection";
import CreateEventRoundsSection from "./CreateEventRoundsSection";
import CreateEventPrizesSection from "./CreateEventPrizesSection";
import CreateEventTracksSection from "./CreateEventTracksSection";
import { useAdminEventsData } from "./useAdminEventsData";
import styles from "./CreateEventWizard.module.css";

type AdminEventsData = ReturnType<typeof useAdminEventsData>;

interface CreateEventWizardProps {
  data: AdminEventsData;
}

const TOC_ITEMS = [
  { id: "general", label: "General Info" },
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
    <div className={styles.wizard}>
      <nav aria-label="Event sections" className={styles.toc}>
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
              className={`btn btn-ghost btn-sm ${styles.tocButton} ${active ? styles.tocButtonActive : ""}`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className={styles.sections}>
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

      <div className={styles.actionBar}>
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
