"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, FileEdit, MessageSquare, Clipboard, Send, Eye, Mail, Search, Filter } from "lucide-react";
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
  const queryClient = useQueryClient();
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<MentorTeam | null>(null);
  const [detailTeamId, setDetailTeamId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");

  const {
    data: teams = [],
    isLoading: loading,
    error,
    refetch: loadTeams,
  } = useQuery({
    queryKey: ["mentor-teams"],
    queryFn: () => apiRequest<MentorTeam[]>("/mentor/teams"),
  });

  useEffect(() => {
    if (error) message.error("Could not load assigned teams.");
  }, [error, message]);

  // Invitation badge derives from the same ["mentor-invitations"] cache the
  // panel uses, so accept/reject there updates this count automatically — no
  // separate fetch or out-of-order guard needed.
  const { data: invitations = [] } = useQuery({
    queryKey: ["mentor-invitations"],
    queryFn: () => apiRequest<MentorInvitationDto[]>("/teams/mentor-invitations"),
  });
  const pendingInvitationCount = invitations.length;

  const stats = useMemo(
    () => [
      { icon: Users, label: "Assigned Teams", value: teams.length },
      {
        icon: Send,
        label: "With Submissions",
        value: teams.filter((t) => t.latestSubmission).length,
        color: "var(--color-emerald)",
      },
      {
        icon: MessageSquare,
        label: "Notes Given",
        value: teams.filter((t) => t.notes).length,
        color: "var(--color-amber)",
      },
    ],
    [teams]
  );

  const eventOptions = useMemo(() => {
    const map = new Map<string, string>();
    teams.forEach((team) => map.set(team.eventName, team.eventName));
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [teams]);

  const visibleTeams = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return teams.filter((team) => {
      if (eventFilter !== "all" && team.eventName !== eventFilter) return false;
      if (teamFilter === "submitted" && !team.latestSubmission) return false;
      if (teamFilter === "missingSubmission" && team.latestSubmission) return false;
      if (teamFilter === "hasNotes" && !team.notes) return false;
      if (teamFilter === "needsNotes" && team.notes) return false;

      if (!query) return true;

      return [
        team.teamName,
        team.categoryName,
        team.eventName,
        team.status,
        team.latestSubmission?.roundName,
      ].some((value) => value?.toLowerCase().includes(query));
    });
  }, [eventFilter, searchText, teamFilter, teams]);

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

  const handleInvitationsChanged = () => {
    void queryClient.invalidateQueries({ queryKey: ["mentor-teams"] });
    void queryClient.invalidateQueries({ queryKey: ["mentor-invitations"] });
  };

  const renderTeamsTab = () => (
    teams.length === 0 ? (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Empty description="You have not been assigned to mentor any teams yet." />
      </div>
    ) : (
      <>
        <div className="glass-card" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1rem" }}>
          <Input
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search team, event, track, or round..."
            prefix={<Search size={15} />}
            allowClear
            style={{ flex: "1 1 260px" }}
          />
          <select className="form-input" value={eventFilter} onChange={(event) => setEventFilter(event.target.value)} style={{ flex: "0 1 220px" }}>
            <option value="all">All events</option>
            {eventOptions.map((eventName) => (
              <option key={eventName} value={eventName}>{eventName}</option>
            ))}
          </select>
          <select className="form-input" value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} style={{ flex: "0 1 210px" }}>
            <option value="all">All teams</option>
            <option value="submitted">With submissions</option>
            <option value="missingSubmission">No submissions</option>
            <option value="hasNotes">Has notes</option>
            <option value="needsNotes">Needs notes</option>
          </select>
          <span className="badge badge-neutral">
            <Filter size={12} style={{ marginRight: 4 }} /> {visibleTeams.length} shown
          </span>
        </div>

        {visibleTeams.length === 0 ? (
          <div className="glass-card" style={{ textAlign: "center", padding: "2.5rem 1rem" }}>
            <Empty description="No teams match these filters." />
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
                {visibleTeams.map((t) => (
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
        )}
      </>
    )
  );

  const tabs: WorkspaceTab[] = [
    { id: "teams", label: "Teams", icon: Users, render: renderTeamsTab },
    {
      id: "invitations",
      label: "Invitations",
      icon: Mail,
      badge: pendingInvitationCount,
      render: () => <MentorInvitationsPanel onChange={handleInvitationsChanged} />,
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
