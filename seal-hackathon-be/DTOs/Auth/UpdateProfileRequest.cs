using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Auth
{
    public class UpdateProfileRequest
    {
        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Phone]
        public string? PhoneNumber { get; set; }

        [MaxLength(50)]
        public string? StudentCode { get; set; }
    }
}
