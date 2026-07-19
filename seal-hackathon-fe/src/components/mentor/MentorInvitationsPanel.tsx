"use client";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { App, Empty, Spin } from "antd";
import { apiRequest } from "@/lib/api";

export interface MentorInvitationDto {
  assignmentId: string;
  teamId: string;
  teamName: string;
  categoryName: string;
  eventName: string;
  invitedAt: string;
}

interface MentorInvitationsPanelProps {
  /** Called after an invitation is accepted or rejected so the parent can refresh its team list. */
  onChange?: () => void;
  /** Reports the current pending-invitation count (drives the tab badge). */
  onCountChange?: (count: number) => void;
}

export default function MentorInvitationsPanel({ onChange, onCountChange }: MentorInvitationsPanelProps) {
  const { message } = App.useApp();
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const {
    data: invitations = [],
    isLoading: loading,
    error,
    refetch: loadInvitations,
  } = useQuery({
    queryKey: ["mentor-invitations"],
    queryFn: () => apiRequest<MentorInvitationDto[]>("/teams/mentor-invitations"),
  });

  useEffect(() => {
    if (error) message.error("Could not load mentor invitations.");
  }, [error, message]);

  // Report the pending count to the parent (drives the tab badge); on error the
  // list stays [] so this reports 0, matching the previous behavior.
  useEffect(() => {
    onCountChange?.(invitations.length);
  }, [invitations.length, onCountChange]);

  const handleAccept = async (assignmentId: string, teamName: string) => {
    setSubmittingId(assignmentId);
    try {
      await apiRequest(`/teams/mentor-invitations/${assignmentId}/accept`, { method: "POST" });
      message.success(`You are now mentoring ${teamName}.`);
      await loadInvitations();
      onChange?.();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not accept invitation.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async (assignmentId: string) => {
    setSubmittingId(assignmentId);
    try {
      await apiRequest(`/teams/mentor-invitations/${assignmentId}/reject`, { method: "POST" });
      message.success("Invitation declined.");
      await loadInvitations();
      onChange?.();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Could not decline invitation.");
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        <Spin size="large" />
        <div className="empty-title">Loading invitations...</div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <Empty description="You do not have any pending mentor invitations." />
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "2rem" }}>
      <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <GraduationCap size={22} style={{ color: "var(--color-primary)" }} /> Pending Mentor Invitations
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {invitations.map((inv) => (
          <div
            key={inv.assignmentId}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", padding: "0.9rem 1rem", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-2)" }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>{inv.teamName}</div>
              <div style={{ fontSize: "0.82rem", color: "var(--color-text-3)" }}>{inv.eventName} · {inv.categoryName}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-3)", marginTop: 2 }}>
                Invited {new Date(inv.invitedAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => handleAccept(inv.assignmentId, inv.teamName)}
                disabled={submittingId !== null}
              >
                {submittingId === inv.assignmentId ? "Accepting..." : "Accept"}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleReject(inv.assignmentId)}
                disabled={submittingId !== null}
              >
                {submittingId === inv.assignmentId ? "Declining..." : "Decline"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
