using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Track
{
    public class UpdateTrackRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
