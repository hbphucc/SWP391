import { Download, FileText, AlertCircle } from "lucide-react";

interface RoundInfoPanelProps {
  eventName?: string | null;
  currentRound: {
    roundName: string;
    submissionDeadline?: string | null;
  } | null;
  promptDocumentId?: string | null;
  promptFileName?: string | null;
  eventStatus?: string | null;
  isApproved: boolean;
  onDownloadPrompt: () => void;
}

export default function RoundInfoPanel({
  eventName,
  currentRound,
  promptDocumentId,
  promptFileName,
  eventStatus,
  isApproved,
  onDownloadPrompt,
}: RoundInfoPanelProps) {
  return (
    <>
      {currentRound && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.25rem",
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Competition</span>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-1)", marginTop: "0.25rem" }}>
              {eventName || "SEAL Hackathon"}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Active Round</span>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-1)", marginTop: "0.25rem" }}>
              {currentRound.roundName}
            </div>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Submission Deadline</span>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-warning)", marginTop: "0.25rem" }}>
              {currentRound.submissionDeadline
                ? new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  }).format(new Date(currentRound.submissionDeadline))
                : "N/A"}
            </div>
          </div>
          {promptDocumentId && (
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>Round Prompt</span>
              <div style={{ marginTop: "0.25rem" }}>
                <button
                  onClick={() => onDownloadPrompt()}
                  className="btn btn-sm"
                  style={{ background: "rgba(99,102,241,0.1)", color: "var(--color-primary-2)", padding: "0.25rem 0.75rem", border: "1px solid rgba(99,102,241,0.2)" }}
                >
                  <Download size={14} style={{ marginRight: "0.35rem" }} /> {promptFileName || "Download Prompt"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isApproved && promptFileName && (
        <div
          style={{
            background: "var(--color-surface-2)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <FileText size={24} style={{ color: "var(--color-primary)" }} />
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-3)", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.05em" }}>
                Event Prompt / Task Description
              </span>
              <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text-1)", marginTop: "0.25rem" }}>
                {promptFileName}
              </div>
            </div>
          </div>
          <div>
            {eventStatus === "Ongoing" ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onDownloadPrompt}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
              >
                <Download size={16} /> Download Prompt
              </button>
            ) : (
              <div style={{ textAlign: "right" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.6 }}
                >
                  <Download size={16} /> Locked
                </button>
                <div style={{ fontSize: "0.75rem", color: "var(--color-warning)", marginTop: "0.25rem" }}>
                  Available when event starts
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.5rem" }}>
        <AlertCircle size={20} style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--color-primary)", fontSize: "0.95rem" }}>Submission Guidelines</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-2)", lineHeight: 1.5 }}>
            Backend currently stores repository, demo/video, and slide/report URLs. Notes and track text are not submitted until matching backend fields are added.
          </p>
        </div>
      </div>
    </>
  );
}
