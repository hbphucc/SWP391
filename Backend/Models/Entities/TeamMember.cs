

namespace SEAL.NET.Models.Entities
{
    public class TeamMember
    {
        public Guid TeamMemberId { get; set; } = Guid.NewGuid();
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public Guid TeamId { get; set; }
        public Team Team { get; set; } = null!;

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;
    }
}
