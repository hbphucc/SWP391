using SEAL.NET.Models.Enums;

namespace SEAL.NET.DTOs.RoundStaff
{
    public class AssignRoundStaffRequest
    {
        public Guid UserId { get; set; }
        public Guid RoundId { get; set; }
        public RoundStaffRole Role { get; set; }
    }

    public class RoundStaffAssignmentDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid RoundId { get; set; }
        public string RoundName { get; set; } = string.Empty;
        public RoundStaffRole Role { get; set; }
        public bool IsActive { get; set; }
    }
}
