using SEAL.NET.Models.Enums;

namespace SEAL.NET.Models.Entities
{
    public class RoundStaffAssignment
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid RoundId { get; set; }
        public Round Round { get; set; } = null!;

        public Guid UserId { get; set; }
        public ApplicationUser User { get; set; } = null!;

        public RoundStaffRole Role { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
        public Guid? AssignedByUserId { get; set; }
        public ApplicationUser? AssignedBy { get; set; }
    }
}
