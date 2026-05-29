using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Team
{
    public class EliminateTeamRequest
    {
        [Required]
        [MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }
}