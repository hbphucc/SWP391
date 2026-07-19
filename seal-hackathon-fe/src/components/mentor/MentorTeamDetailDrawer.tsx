"use client";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, FileText, Send, Users } from "lucide-react";
import { App, Drawer, Empty, Spin } from "antd";
import { apiRequest } from "@/lib/api";

interface MentorTeamMember {
  id: string;
  name: string;
  email: string;
  role?: string | null;
  studentCode?: string | null;
  schoolName?: string | null;
}

interface MentorSubmission {
  submissionId: string;
  repositoryUrl?: string | null;
  demoUrl?: string | null;
  slideUrl?: string | null;
  submittedAt: string;
  roundName: string;
}

interface MentorTeamDetail {
  teamId: string;
  teamName: string;
  status: string;
  category: {
    categoryId: string;
    categoryName: string;
    eventId: string;
    eventName: string;
  };
  currentRound: {
    roundId: string;
    roundName: string;
  } | null;
  notes?: string | null;
  members: MentorTeamMember[];
  submissions: MentorSubmission[];
}

interface MentorTeamDetailDrawerProps {
  open: boolean;
  teamId: string | null;
  onClose: () => void;
}

function getStatusBadgeClass(status: string) {
  if (["Approved", "Active", "Champion", "Qualified"].includes(status)) return "badge-success";
  if (["Eliminated", "Rejected", "Cancelled"].includes(status)) return "badge-danger";
  if (status === "Pending") return "badge-warning";
  return "badge-neutral";
}

export default function MentorTeamDetailDrawer({ open, teamId, onClose }: MentorTeamDetailDrawerProps) {
  const { message } = App.useApp();
  const {
    data: team = null,
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["mentor-team", teamId],
    queryFn: () => apiRequest<MentorTeamDetail>(`/mentor/teams/${teamId}`),
    enabled: open && !!teamId,
  });

  useEffect(() => {
    if (error) message.error("Could not load team details.");
  }, [error, message]);

  return (
    <Drawer
      title="Team Details"
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
    >
      {loading ? (
        <div className="empty-state">
          <Spin size="large" />
          <div className="empty-title">Loading team details...</div>
        </div>
      ) : !team ? (
        <div className="empty-state">
          <Empty description="Select a team to view details." />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass-card" style={{ padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="avatar-placeholder" style={{ width: 42, height: 42, fontSize: "0.9rem" }}>
                  {team.teamName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.35rem" }}>{team.teamName}</h2>
                  <div style={{ color: "var(--color-text-3)", fontSize: "0.85rem", marginTop: 2 }}>
                    {team.category.eventName}
                  </div>
                </div>
              </div>
              <span className={`badge ${getStatusBadgeClass(team.status)}`}>
                {team.status.toUpperCase()}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginBottom: 2 }}>Track</div>
                <div style={{ fontWeight: 600 }}>{team.category.categoryName}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginBottom: 2 }}>Event</div>
                <div style={{ fontWeight: 600 }}>{team.category.eventName}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginBottom: 2 }}>Current Round</div>
                <div style={{ fontWeight: 600 }}>{team.currentRound?.roundName ?? "No active round"}</div>
              </div>
            </div>

            {team.notes && (
              <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--color-border-2)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-3)", marginBottom: 4 }}>Mentor Notes</div>
                <div style={{ color: "var(--color-text-2)", whiteSpace: "pre-wrap" }}>{team.notes}</div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: "1rem" }}>
            <h3 style={{ margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem" }}>
              <Users size={16} style={{ color: "var(--color-primary)" }} /> Members
            </h3>
            {team.members.length === 0 ? (
              <Empty description="No members found." />
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Student Code</th>
                      <th>School</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.members.map((member) => (
                      <tr key={member.id}>
                        <td className="table-cell-primary">
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                            <div className="avatar-placeholder" style={{ width: 30, height: 30, fontSize: "0.72rem" }}>
                              {member.name.substring(0, 2).toUpperCase()}
                            </div>
                            {member.name}
                          </div>
                        </td>
                        <td>{member.email}</td>
                        <td>{member.role ?? "-"}</td>
                        <td>{member.studentCode ?? "-"}</td>
                        <td>{member.schoolName ?? "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: "1rem" }}>
            <h3 style={{ margin: "0 0 1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem" }}>
              <Send size={16} style={{ color: "var(--color-primary)" }} /> Submission History
            </h3>
            {team.submissions.length === 0 ? (
              <Empty description="No submissions found." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {team.submissions.map((submission) => {
                  const hasLinks = Boolean(submission.repositoryUrl || submission.demoUrl || submission.slideUrl);
                  return (
                    <div
                      key={submission.submissionId}
                      style={{ padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
                          <FileText size={15} style={{ color: "var(--color-primary)" }} />
                          {submission.roundName}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-3)" }}>
                          {new Date(submission.submittedAt).toLocaleString()}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {submission.repositoryUrl && (
                          <a href={submission.repositoryUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            <ExternalLink size={12} style={{ marginRight: 4 }} /> Repo
                          </a>
                        )}
                        {submission.demoUrl && (
                          <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            <ExternalLink size={12} style={{ marginRight: 4 }} /> Demo
                          </a>
                        )}
                        {submission.slideUrl && (
                          <a href={submission.slideUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                            <ExternalLink size={12} style={{ marginRight: 4 }} /> Slides
                          </a>
                        )}
                        {!hasLinks && (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-3)" }}>No links provided by the team.</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
