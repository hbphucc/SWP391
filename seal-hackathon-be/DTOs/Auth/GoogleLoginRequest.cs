using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Auth
{
    public class GoogleLoginRequest
    {
        [Required]
        public string IdToken { get; set; } = string.Empty;
    }
}
