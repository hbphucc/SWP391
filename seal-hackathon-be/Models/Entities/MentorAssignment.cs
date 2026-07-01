using System;
using System.ComponentModel.DataAnnotations;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Models.Entities
{
    public class MentorAssignment
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid MentorUserId { get; set; }
        public ApplicationUser Mentor { get; set; } = null!;

        public Guid TeamId { get; set; }
        public Team Team { get; set; } = null!;

        public Guid? AssignedByUserId { get; set; }
        public ApplicationUser? AssignedBy { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Invite/accept state (reuses the same enum as team-member invitations).
        /// A row is created as Pending when a leader invites a mentor; it only
        /// becomes the team's real mentor (IsActive = true) once the mentor Accepts.
        /// </summary>
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

        /// <summary>
        /// True only for the one Accepted assignment currently backing a team's
        /// mentor. Left false for Pending/Rejected/Cancelled rows so every existing
        /// "who is this team's mentor" query (filtered on IsActive) keeps working
        /// unchanged after adding the invite/accept step.
        /// </summary>
        public bool IsActive { get; set; } = false;

        public string? Notes { get; set; }
    }
}
