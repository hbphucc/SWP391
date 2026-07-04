import { Search, GraduationCap, Check } from "lucide-react";
import { Modal } from "antd";
import StatusBadge from "@/components/StatusBadge";
import type { TeamDto, MentorOption } from "./teamTypes";

interface InviteMentorModalProps {
  open: boolean;
  onClose: () => void;
  mentorSearch: string;
  setMentorSearch: (v: string) => void;
  loadingMentors: boolean;
  mentors: MentorOption[];
  myTeam: TeamDto | null;
  submitting: boolean;
  assigningMentorId: string | null;
  onAssignMentor: (mentorId: string) => void;
}

export default function InviteMentorModal({
  open, onClose, mentorSearch, setMentorSearch, loadingMentors, mentors, myTeam,
  submitting, assigningMentorId, onAssignMentor,
}: InviteMentorModalProps) {
  const q = mentorSearch.trim().toLowerCase();
  const filtered = q
    ? mentors.filter((m) => m.fullName.toLowerCase().includes(q) || (m.email ?? "").toLowerCase().includes(q))
    : mentors;

  return (
    <Modal
      title="Invite a Mentor"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
      centered
      styles={{ body: { paddingTop: "1rem" } }}
    >
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-3)" }} />
        <input
          className="form-input"
          style={{ paddingLeft: 32, width: "100%" }}
          placeholder="Search by name or email..."
          value={mentorSearch}
          onChange={(e) => setMentorSearch(e.target.value)}
          aria-label="Search mentors"
        />
      </div>

      {loadingMentors ? (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <span className="spinner" />
          <div style={{ marginTop: "0.5rem", color: "var(--color-text-3)" }}>Loading mentors...</div>
        </div>
      ) : mentors.length === 0 ? (
        <div className="empty-state" style={{ padding: "2rem" }}>
          <GraduationCap size={40} className="empty-icon" />
          <div className="empty-title">No mentors available</div>
          <div className="empty-desc">There are no approved mentors in the system yet.</div>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "var(--color-text-3)" }}>
          No mentors match “{mentorSearch}”.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
          {filtered.map((mentor) => {
            const isCurrent = mentor.id === myTeam?.mentor?.id;
            return (
              <div
                key={mentor.id}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem",
                  padding: "1rem",
                  background: isCurrent ? "rgba(99,102,241,0.06)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isCurrent ? "var(--color-primary)" : "var(--color-border)"}`,
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem", minWidth: 0 }}>
                  <div className="avatar-placeholder" style={{ width: 40, height: 40, fontSize: "1rem", flexShrink: 0, background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
                    {mentor.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600, color: "var(--color-text-1)" }}>{mentor.fullName}</span>
                      <StatusBadge status={mentor.availability} />
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>{mentor.email}</div>
                    {mentor.schoolName && (
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-2)", marginTop: "0.15rem" }}>{mentor.schoolName}</div>
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: "0.4rem" }}>
                      {mentor.developerRole && <span className="badge badge-cyan" style={{ fontSize: "0.68rem" }}>{mentor.developerRole}</span>}
                      {mentor.skills.slice(0, 5).map((s) => (
                        <span key={s} className="badge badge-neutral" style={{ fontSize: "0.68rem" }}>{s}</span>
                      ))}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "var(--color-text-3)", marginTop: "0.4rem" }}>
                      Mentoring {mentor.teamsMentored} team{mentor.teamsMentored === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <button
                  className={`btn btn-sm ${isCurrent ? "btn-secondary" : "btn-primary"}`}
                  disabled={submitting || isCurrent}
                  onClick={() => onAssignMentor(mentor.id)}
                  style={{ flexShrink: 0 }}
                >
                  {assigningMentorId === mentor.id
                    ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Inviting</>
                    : isCurrent
                      ? <><Check size={13} /> Current Mentor</>
                      : "Invite"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
