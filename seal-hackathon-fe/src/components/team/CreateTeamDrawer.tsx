"use client";
import { useEffect, useMemo, useState } from "react";
import { App, Drawer, Select } from "antd";
import { Plus, Trash2, UserPlus, Users, GraduationCap } from "lucide-react";
import { ApiError, apiRequest } from "@/lib/api";

/**
 * Unified create-team drawer.
 *
 * Replaces the previous fragmented flow (inline form → create team → open
 * "Choose Mentor" modal as a second step) with one screen that captures
 * everything the backend needs in a single POST /teams call: name, category,
 * dynamic member list, and an optional mentor. The backend assigns the mentor
 * in the same SaveChangesAsync, so partial-success states are impossible.
 *
 * onSuccess is invoked after the create call returns 200, so the parent page
 * can refresh its `myTeam` view without this component owning that state.
 */
export type CreateTeamCategoryOption = {
  categoryId: string;
  categoryName: string;
  eventName: string;
};

export type CreateTeamMentorOption = {
  id: string;
  fullName: string;
  email: string;
  schoolName?: string | null;
  developerRole?: string | null;
  skills: string[];
  teamsMentored: number;
  availability: string;
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
  // Dynamic list — each entry is one student code or email. Empty trailing
  // rows are fine; we strip them at submit time.
  const [memberInputs, setMemberInputs] = useState<string[]>(["", ""]);
  const [mentorId, setMentorId] = useState<string | undefined>(undefined);
  const [mentors, setMentors] = useState<CreateTeamMentorOption[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // The "selected" category we render. If the leader hasn't picked one yet we
  // fall back to the first available — derived rather than copied into state to
  // avoid a setState-in-effect cascade.
  const effectiveCategoryId =
    categoryId || (categories.length > 0 ? categories[0].categoryId : "");

  // Fetch mentors lazily on first open. We keep the result for the lifetime of
  // the drawer so reopening doesn't refetch unless the parent unmounts us. The
  // Promise.resolve hop defers the setState out of the effect body so the
  // project's react-hooks/set-state-in-effect rule stays happy.
  useEffect(() => {
    if (!open || mentors.length > 0) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      if (cancelled) return;
      setLoadingMentors(true);
      try {
        const list = await apiRequest<CreateTeamMentorOption[]>("/teams/mentors");
        if (!cancelled) setMentors(list);
      } catch {
        if (!cancelled) message.error("Could not load mentor list.");
      } finally {
        if (!cancelled) setLoadingMentors(false);
      }
    });
    return () => { cancelled = true; };
  }, [open, mentors.length, message]);

  const resetForm = () => {
    setTeamName("");
    setCategoryId("");
    setMemberInputs(["", ""]);
    setMentorId(undefined);
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

    // Reject duplicates before the backend has to.
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
          mentorId: mentorId ?? null,
        }),
      });

      message.success(
        mentorId
          ? "Team registered with mentor assigned. Invitations sent to members."
          : "Team registered and invitations sent to members.",
      );
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
      width={560}
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
            {categories.map((c) => (
              <option key={c.categoryId} value={c.categoryId}>
                {c.eventName} — {c.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* Member dynamic list */}
        <div className="form-group">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <label className="form-label" style={{ margin: 0 }}>
              <UserPlus size={13} /> Members ({trimmedMembers.length} / {MEMBER_CAP})
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
            Student code or email of each member you want to invite. The team needs 3-5 members including you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {memberInputs.map((value, index) => (
              <div key={index} style={{ display: "flex", gap: "0.5rem" }}>
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder={`Member ${index + 1} student code or email`}
                  value={value}
                  onChange={(e) => setMemberAt(index, e.target.value)}
                  disabled={submitting}
                />
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

        {/* Optional mentor */}
        <div className="form-group">
          <label className="form-label" htmlFor="ct-mentor">
            <GraduationCap size={13} /> Mentor (optional)
          </label>
          <Select
            id="ct-mentor"
            value={mentorId}
            onChange={(v) => setMentorId(v)}
            allowClear
            showSearch
            loading={loadingMentors}
            placeholder={loadingMentors ? "Loading mentors..." : "Pick a mentor now, or assign later"}
            disabled={submitting}
            style={{ width: "100%" }}
            optionFilterProp="label"
            options={mentors.map((m) => ({
              value: m.id,
              label: `${m.fullName} · ${m.availability}`,
              // We render via children for the richer two-line look, but keep
              // `label` populated so antd's search-by-text works out of the box.
            }))}
            optionRender={(opt) => {
              const m = mentors.find((x) => x.id === opt.value);
              if (!m) return opt.label;
              return (
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.3 }}>
                  <span style={{ fontWeight: 600 }}>
                    {m.fullName}{" "}
                    <span style={{ fontSize: "0.72rem", color: m.availability === "Busy" ? "var(--color-warning)" : "var(--color-success)" }}>
                      · {m.availability}
                    </span>
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>
                    {m.email}
                    {m.schoolName ? ` · ${m.schoolName}` : ""}
                    {` · mentoring ${m.teamsMentored}`}
                  </span>
                </div>
              );
            }}
          />
          <span className="form-hint">You can also change or remove the mentor after the team is created.</span>
        </div>
      </div>
    </Drawer>
  );
}
