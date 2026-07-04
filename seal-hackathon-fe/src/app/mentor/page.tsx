"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Users, FileEdit, MessageSquare, Clipboard, Send, Eye, Mail } from "lucide-react";
import { App, Modal, Input, Spin, Empty, Tag } from "antd";
import { apiRequest } from "@/lib/api";
import StatCardRow from "@/components/workspace/StatCardRow";
import WorkspaceTabs, { WorkspaceTab } from "@/components/workspace/WorkspaceTabs";
import MentorInvitationsPanel, { MentorInvitationDto } from "@/components/mentor/MentorInvitationsPanel";
import MentorTeamDetailDrawer from "@/components/mentor/MentorTeamDetailDrawer";

interface SubmissionData {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  roundName: string;
}

interface MentorTeam {
  teamId: string;
  teamName: string;
  categoryName: string;
  eventName: string;
  status: string;
  membersCount: number;
  notes?: string | null;
  latestSubmission?: SubmissionData | null;
}

export default function MentorWorkspacePage() {
  const { message } = App.useApp();
  const [teams, setTeams] = useState<MentorTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MentorTeam | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<MentorTeam[]>("/mentor/teams");
      setTeams(data);
    } catch {
      message.error("Could not load assigned teams.");
    } finally {
      setLoading(false);
    }
  }, [message]);

  // Monotonic sequence so an older in-flight count fetch can never overwrite
  // a newer count (e.g. the panel reporting fresh data after accept/reject).
  const invitationCountSeqRef = useRef(0);

  const loadInvitationCount = useCallback(async () => {
    const seq = ++invitationCountSeqRef.current;
    try {
      const data = await apiRequest<MentorInvitationDto[]>("/teams/mentor-invitations");
      if (seq === invitationCountSeqRef.current) setPendingInvitationCount(data.length);
    } catch {
      if (seq === invitationCountSeqRef.current) setPendingInvitationCount(0);
    }
  }, []);

  const reportInvitationCount = useCallback((count: number) => {
    // The panel's report reflects the freshest server state — invalidate any
    // older page-level fetch still in flight.
    invitationCountSeqRef.current++;
    setPendingInvitationCount(count);
  }, []);

  useEffect(() => {
    const trigger = async () => {
      await Promise.resolve();
      void loadTeams();
      void loadInvitationCount();
    };
    void trigger();
  }, [loadTeams, loadInvitationCount]);

  const stats = useMemo(
    () => [
      { icon: Users, label: "Assigned Teams", value: teams.length },
      {
        icon: Send,
        label: "With Submissions",
        value: teams.filter((t) => t.latestSubmission).length,
        color: "#10b981",
      },
      {
        icon: MessageSquare,
        label: "Notes Given",
        value: teams.filter((t) => t.notes).length,
        color: "#f59e0b",
      },
    ],
    [teams]
  );

  const openReview = (team: MentorTeam) => {
    setSelectedTeam(team);
    setNote(team.notes || "");
    setReviewModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedTeam) return;
    setSubmitting(true);
    try {
      await apiRequest(`/mentor/teams/${selectedTeam.teamId}/notes`, {
        method: "POST",
        body: JSON.stringify({ notes: note })
      });
      message.success("Notes saved successfully!");
      setReviewModal(false);
      void loadTeams();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Failed to save notes.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvitationsChanged = useCallback(() => {
    void loadTeams();
    void loadInvitationCount();
  }, [loadTeams, loadInvitationCount]);

  const renderTeamsTab = () => (
    teams.length === 0 ? (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Empty description="You have not been assigned to mentor any teams yet." />
      </div>
    ) : (
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Team Name</th>
              <th>Track / Event</th>
              <th>Members</th>
              <th>Status</th>
              <th>Submission Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t) => (
              <tr key={t.teamId} onClick={() => setDetailTeamId(t.teamId)} style={{ cursor: "pointer" }}>
                <td className="table-cell-primary">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                      {t.teamName.substring(0, 2).toUpperCase()}
                    </div>
                    {t.teamName}
                  </div>
                </td>
                <td>
                  <div>{t.categoryName}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)" }}>{t.eventName}</div>
                </td>
                <td>
                  <span className="badge badge-neutral">
                    <Users size={10} style={{ marginRight: 4 }} /> {t.membersCount}
                  </span>
                </td>
                <td>
                  <span className={`badge ${t.status === "Approved" ? "badge-success" : t.status === "Eliminated" ? "badge-danger" : "badge-warning"}`}>
                    {t.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  {t.latestSubmission ? (
                    <div>
                      <Tag color="cyan">Submitted ({t.latestSubmission.roundName})</Tag>
                      <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginTop: 2 }}>
                        {new Date(t.latestSubmission.submittedAt).toLocaleDateString()}
                      </div>
                    </div>
                  ) : (
                    <Tag color="default">No submissions</Tag>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <button className="btn btn-secondary btn-sm" onClick={(event) => { event.stopPropagation(); setDetailTeamId(t.teamId); }}>
                      <Eye size={13} style={{ marginRight: 4 }} />
                      <span> View Details</span>
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={(event) => { event.stopPropagation(); openReview(t); }}>
                      {t.notes ? (
                        <>
                          <MessageSquare size={13} style={{ marginRight: 4 }} />
                          <span> Edit Note</span>
                        </>
                      ) : (
                        <>
                          <FileEdit size={13} style={{ marginRight: 4 }} />
                          <span> Add Note</span>
                        </>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  );

  const tabs: WorkspaceTab[] = [
    { id: "teams", label: "Teams", icon: Users, render: renderTeamsTab },
    {
      id: "invitations",
      label: "Invitations",
      icon: Mail,
      badge: pendingInvitationCount,
      render: () => <MentorInvitationsPanel onChange={handleInvitationsChanged} onCountChange={reportInvitationCount} />,
    },
  ];

  if (loading) {
    return (
      <div className="empty-state">
        <Spin size="large" />
        <div className="empty-title">Loading teams...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Mentor Workspace</h1>
          <p className="page-subtitle">View and evaluate the teams you are mentoring</p>
        </div>
      </div>

      <StatCardRow items={stats} />

      <WorkspaceTabs defaultTab="teams" tabs={tabs} />

      <Modal
        title={`Review Notes for ${selectedTeam?.teamName}`}
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        onOk={handleSaveNote}
        confirmLoading={submitting}
        okText="Save Notes"
      >
        <div style={{ marginBottom: "1rem" }}>
          {selectedTeam?.latestSubmission && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--color-border-2)", borderRadius: "var(--radius-md)", padding: "1rem", marginBottom: "1.25rem" }}>
              <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-2)", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                Latest Submission Documents
              </h4>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {selectedTeam.latestSubmission.repositoryUrl && (
                  <a href={selectedTeam.latestSubmission.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Repo ↗</a>
                )}
                {selectedTeam.latestSubmission.demoUrl && (
                  <a href={selectedTeam.latestSubmission.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Demo ↗</a>
                )}
                {selectedTeam.latestSubmission.slideUrl && (
                  <a href={selectedTeam.latestSubmission.slideUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">Slides ↗</a>
                )}
                {!selectedTeam.latestSubmission.repositoryUrl && !selectedTeam.latestSubmission.demoUrl && !selectedTeam.latestSubmission.slideUrl && (
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>No links provided by the team.</span>
                )}
              </div>
            </div>
          )}
          <p style={{ color: "var(--color-text-2)", marginBottom: "1rem" }}>
            <Clipboard size={14} style={{ marginRight: 6, verticalAlign: 'middle', display: 'inline' }} />
            Record your advice, comments, and guidance for this team.
          </p>
          <Input.TextArea
            rows={6}
            placeholder="Enter your notes here..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </Modal>

      <MentorTeamDetailDrawer
        open={Boolean(detailTeamId)}
        teamId={detailTeamId}
        onClose={() => setDetailTeamId(null)}
      />
    </div>
  );
}
