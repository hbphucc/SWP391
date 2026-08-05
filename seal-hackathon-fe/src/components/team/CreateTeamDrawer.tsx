"use client";
import { useEffect, useMemo, useState } from "react";
import { App, Drawer } from "antd";
import { Plus, Trash2, UserPlus, Users } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/api";

type CreateTeamCategoryOption = {
  categoryId: string;
  categoryName: string;
  eventId: string;
  eventName: string;
  registrationEndDate: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  categories: CreateTeamCategoryOption[];
};

const MEMBER_CAP = 4; // 2-4 invitees + leader = 3-5 total

export default function CreateTeamDrawer({ open, onClose, onSuccess, categories }: Props) {
  const { message } = App.useApp();

  const [teamName, setTeamName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [memberInputs, setMemberInputs] = useState<string[]>(["", ""]);
  const [submitting, setSubmitting] = useState(false);

  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<{email: string, fullName: string, studentCode: string}[]>([]);

  useEffect(() => {
    const handleOutsideClick = () => {
      setSuggestions([]);
      setActiveSuggestionIndex(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleInputChange = async (index: number, val: string) => {
    setMemberAt(index, val);
    if (!val.trim()) {
      setSuggestions([]);
      setActiveSuggestionIndex(null);
      return;
    }
    setActiveSuggestionIndex(index);
    try {
      const res = await apiRequest<{email: string, fullName: string, studentCode: string}[]>(
        `/teams/members/search?query=${encodeURIComponent(val)}&categoryId=${effectiveCategoryId}`
      );
      setSuggestions(res);
    } catch {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (index: number, email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setMemberAt(index, email);
    setSuggestions([]);
    setActiveSuggestionIndex(null);
  };

  const effectiveCategoryId =
    categoryId || (categories.length > 0 
      ? (categories.find(c => new Date(c.registrationEndDate) >= new Date())?.categoryId || categories[0].categoryId) 
      : "");

  const resetForm = () => {
    setTeamName("");
    setCategoryId("");
    setMemberInputs(["", ""]);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const addMemberRow = () => {
    if (memberInputs.length >= MEMBER_CAP) return;
    setMemberInputs((rows) => [...rows, ""]);
  };

  const removeMemberRow = (index: number) => {
    setMemberInputs((rows) => rows.filter((_, i) => i !== index));
  };

  const setMemberAt = (index: number, value: string) => {
    setMemberInputs((rows) => rows.map((row, i) => (i === index ? value : row)));
  };

  const trimmedMembers = useMemo(
    () => memberInputs.map((s) => s.trim()).filter(Boolean),
    [memberInputs],
  );

  const handleSubmit = async () => {
    if (!teamName.trim()) { message.error("Team name is required."); return; }
    if (!effectiveCategoryId) { message.error("Select a category before creating a team."); return; }
    if (trimmedMembers.length < 2 || trimmedMembers.length > MEMBER_CAP) {
      message.error("Add 2 to 4 member student codes or emails (the team needs 3 to 5 members including you).");
      return;
    }

    const uniq = new Set(trimmedMembers.map((s) => s.toLowerCase()));
    if (uniq.size !== trimmedMembers.length) {
      message.error("Member list contains duplicates.");
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest("/teams", {
        method: "POST",
        body: JSON.stringify({
          teamName: teamName.trim(),
          categoryId: effectiveCategoryId,
          memberStudentCodesOrEmails: trimmedMembers,
          mentorId: null,
        }),
      });

      message.success("Team registered and invitations sent to members.");
      resetForm();
      onClose();
      await onSuccess();
    } catch (err) {
      if (err instanceof ApiError && err.code === "EventNotPublished") {
        message.warning("This event is still a draft. Wait for the admin to publish it before registering a team.");
      } else {
        message.error(err instanceof Error ? err.message : "Could not create team.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
          <Users size={18} /> Create Team
        </span>
      }
      size="large"
      maskClosable={!submitting}
      destroyOnHidden
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
          <button className="btn btn-ghost" onClick={handleClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="spinner" /> : <><Plus size={16} /> Create Team</>}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {/* Team name */}
        <div className="form-group">
          <label className="form-label" htmlFor="ct-name">Team Name *</label>
          <input
            id="ct-name"
            className="form-input"
            placeholder="e.g. Code Wizards"
            value={teamName}
            maxLength={100}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={submitting}
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label className="form-label" htmlFor="ct-category">Event &amp; Category *</label>
          <select
            id="ct-category"
            className="form-input"
            value={effectiveCategoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={submitting || categories.length === 0}
          >
            {categories.length === 0 && <option value="">No published events available</option>}
            {categories.map((c) => {
              const isClosed = new Date(c.registrationEndDate) < new Date();
              return (
                <option key={c.categoryId} value={c.categoryId} disabled={isClosed}>
                  {c.eventName} — {c.categoryName} {isClosed ? "(Closed)" : ""}
                </option>
              );
            })}
          </select>
        </div>

        {/* Member dynamic list */}
        <div className="form-group">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <label className="form-label" style={{ margin: 0 }}>
              <UserPlus size={13} /> Invitees ({trimmedMembers.length} / {MEMBER_CAP})
            </label>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addMemberRow}
              disabled={submitting || memberInputs.length >= MEMBER_CAP}
            >
              <Plus size={13} /> Add
            </button>
          </div>
          <p className="form-hint" style={{ marginBottom: "0.5rem" }}>
            Student code or email of each person you want to invite. They become team members only after accepting the invitation. The team needs 3-5 members including you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {memberInputs.map((value, index) => (
              <div key={index} style={{ display: "flex", gap: "0.5rem", position: "relative" }}>
                <div style={{ flex: 1, position: "relative" }}>
                  <input
                    className="form-input"
                    placeholder={`Member ${index + 1} student code or email`}
                    value={value}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onFocus={(e) => handleInputChange(index, e.target.value)}
                    disabled={submitting}
                  />
                  {activeSuggestionIndex === index && suggestions.length > 0 && (
                    <ul className="suggestions-list">
                      {suggestions.map((user) => (
                        <li
                          key={user.email}
                          className="suggestion-item"
                          onMouseDown={(e) => selectSuggestion(index, user.email, e)}
                          style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", cursor: "pointer", borderBottom: "1px solid var(--color-border-2)" }}
                        >
                          <div className="avatar-placeholder" style={{ width: 32, height: 32, fontSize: "0.8rem", flexShrink: 0, background: "rgba(99,102,241,0.1)", color: "var(--color-primary)" }}>
                            {user.fullName.charAt(0)}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                            <span style={{ fontWeight: 500, fontSize: "0.95rem", color: "var(--color-text-1)" }}>{user.fullName} {user.studentCode ? `(${user.studentCode})` : ""}</span>
                            <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>{user.email}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {memberInputs.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-icon btn-sm"
                    onClick={() => removeMemberRow(index)}
                    disabled={submitting}
                    aria-label={`Remove member ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
