import type { Dispatch, SetStateAction } from "react";
import { Upload, Play, FileText, GitBranch, Link as LinkIcon, AlertCircle } from "lucide-react";

export type SubmissionFormState = {
  repositoryUrl: string;
  demoUrl: string;
  slideUrl: string;
  videoUrl: string;
  description: string;
  consent: boolean;
};

interface SubmissionFormProps {
  form: SubmissionFormState;
  setForm: Dispatch<SetStateAction<SubmissionFormState>>;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  teamStatus?: string;
  eventStatus?: string | null;
}

export default function SubmissionForm({
  form,
  setForm,
  onSubmit,
  submitting,
  isSubmitted,
  isApproved,
  teamStatus,
  eventStatus,
}: SubmissionFormProps) {
  const fieldsDisabled = submitting || !isApproved || eventStatus !== "Ongoing";

  return (
    <>
      {!isApproved && (
        <div style={{ fontSize: "0.85rem", color: "var(--color-warning)", marginBottom: "1rem" }}>
          Only approved teams can submit. Current team status: {teamStatus || "Pending"}.
        </div>
      )}

      {eventStatus !== "Ongoing" && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", color: "var(--color-warning)", marginBottom: "1.5rem", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-md)", padding: "0.75rem" }}>
          <AlertCircle size={16} />
          <span>Submissions are locked. The event is not active (Current Status: {eventStatus || "Draft"}).</span>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div className="form-group">
          <label className="form-label"><GitBranch size={14} /> GitHub Repository URL <span style={{ color: "#ef4444" }}>*</span></label>
          <input className="form-input" type="url" placeholder="https://github.com/your-username/project-repo" required value={form.repositoryUrl} onChange={e => setForm({...form, repositoryUrl: e.target.value})} disabled={fieldsDisabled} />
        </div>

        <div className="form-group">
          <label className="form-label"><Play size={14} /> Live Demo URL</label>
          <input className="form-input" type="url" placeholder="https://your-project-demo.vercel.app" value={form.demoUrl} onChange={e => setForm({...form, demoUrl: e.target.value})} disabled={fieldsDisabled} />
        </div>

        <div className="form-group">
          <label className="form-label"><FileText size={14} /> Presentation / Report URL <span style={{ color: "#ef4444" }}>*</span></label>
          <input className="form-input" type="url" placeholder="Google Slides, Canva, or PDF link" required value={form.slideUrl} onChange={e => setForm({...form, slideUrl: e.target.value})} disabled={fieldsDisabled} />
        </div>

        <div className="form-group">
          <label className="form-label"><LinkIcon size={14} /> Demo Video URL</label>
          <input className="form-input" type="url" placeholder="YouTube or Loom link" value={form.videoUrl} onChange={e => setForm({...form, videoUrl: e.target.value})} disabled={fieldsDisabled} />
          <span className="form-hint">If Live Demo URL is empty, this video URL is sent as DemoUrl.</span>
        </div>

        <div className="form-group">
          <label className="form-label">Brief Description / Note for Judges</label>
          <textarea className="form-textarea" rows={4} placeholder="Not sent yet: backend does not have a matching submission description field." value={form.description} onChange={e => setForm({...form, description: e.target.value})} disabled={fieldsDisabled} />
        </div>

        <div className="form-group" style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginTop: "0.5rem" }}>
          <input
            type="checkbox"
            id="consent"
            style={{ marginTop: "0.25rem", width: "16px", height: "16px", cursor: "pointer" }}
            checked={form.consent}
            onChange={e => setForm({...form, consent: e.target.checked})}
            disabled={fieldsDisabled}
          />
          <label htmlFor="consent" style={{ fontSize: "0.9rem", color: "var(--color-text-2)", cursor: "pointer", lineHeight: 1.5 }}>
            <strong>Team Consent & Rules:</strong> I confirm that all team members have contributed to this project and we agree to the Hackathon Code of Conduct and official rules.
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.6rem 2rem" }} disabled={fieldsDisabled}>
            {submitting ? <span className="spinner" /> : <><Upload size={16} /> {isSubmitted ? "Update Submission" : "Submit Project"}</>}
          </button>
        </div>
      </form>
    </>
  );
}
