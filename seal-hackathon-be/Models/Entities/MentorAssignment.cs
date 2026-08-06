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

        /// <summary>
        /// The round this assignment belongs to. Admins pick a round first and then
        /// the teams inside it, so mentoring is scoped the same way judging is.
        ///
        /// Nullable only because rows created before rounds existed cannot be given
        /// one without guessing. Treat null as "assigned for the whole event" and
        /// set it on everything new.
        /// </summary>
        public Guid? RoundId { get; set; }
        public Round? Round { get; set; }

        /// <summary>
        /// Null while the mentor is on the round but no team has been chosen yet —
        /// the first half of the two-step assignment. A row only grants access to a
        /// team's chat and documents once this is filled in.
        /// </summary>
        public Guid? TeamId { get; set; }
        public Team? Team { get; set; }

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
