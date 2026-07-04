import { UserPlus } from "lucide-react";

interface MemberSuggestion {
  email: string;
  fullName: string;
  studentCode: string;
}

interface AddMemberPanelProps {
  memberCodeToAdd: string;
  onMemberInputChange: (val: string) => void;
  onSelectSuggestion: (email: string, e: React.MouseEvent) => void;
  memberSuggestions: MemberSuggestion[];
  showMemberSuggestions: boolean;
  submitting: boolean;
  onAddMember: () => void;
}

export default function AddMemberPanel({
  memberCodeToAdd, onMemberInputChange, onSelectSuggestion, memberSuggestions, showMemberSuggestions,
  submitting, onAddMember,
}: AddMemberPanelProps) {
  return (
    <div className="glass-card" style={{ maxWidth: 520, marginBottom: "2rem" }}>
      <h3 style={{ fontSize: "1rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <UserPlus size={18} /> Add Member
      </h3>
      <div className="form-group">
        <label className="form-label" htmlFor="addMember">Student Code or Email</label>
        <div style={{ display: "flex", gap: "0.75rem", position: "relative" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              id="addMember"
              className="form-input"
              placeholder="Approved student code or email"
              value={memberCodeToAdd}
              onChange={(event) => onMemberInputChange(event.target.value)}
              onFocus={(event) => onMemberInputChange(event.target.value)}
            />
            {showMemberSuggestions && memberSuggestions.length > 0 && (
              <ul className="suggestions-list">
                {memberSuggestions.map((user) => (
                  <li
                    key={user.email}
                    className="suggestion-item"
                    onMouseDown={(e) => onSelectSuggestion(user.email, e)}
                    style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--color-border-2)" }}
                  >
                    <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", flexShrink: 0, background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
                      {user.fullName.charAt(0)}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 500, fontSize: "0.95rem" }}>{user.fullName} {user.studentCode ? `(${user.studentCode})` : ""}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{user.email}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="btn btn-primary" disabled={!memberCodeToAdd.trim() || submitting} onClick={onAddMember}>
            <UserPlus size={15} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
