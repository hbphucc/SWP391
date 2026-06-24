using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Team
{
    public class CreateTeamRequest
    {
        [Required, MaxLength(100)]
        public string TeamName { get; set; } = string.Empty;

        [Required]
        public Guid CategoryId { get; set; }

        public List<Guid> MemberIds { get; set; } = new();
        public List<string> MemberStudentCodesOrEmails { get; set; } = new();
        public List<string> MemberStudentCodes { get; set; } = new();

        /// <summary>
        /// Optional mentor selected at team-creation time. When set, the mentor is
        /// assigned in the same SaveChanges as the team itself — no separate call to
        /// /teams/my-team/mentor needed. Leave null to defer mentor selection.
        /// </summary>
        public Guid? MentorId { get; set; }
    }
}
