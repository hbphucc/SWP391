using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Team
{
    public class AddTeamMemberRequest
    {
        [Required]
        public Guid UserId { get; set; }
    }
}