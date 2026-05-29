using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.User
{
    public class UpdateUserRoleRequest
    {
        [Required]
        public string Role { get; set; } = string.Empty;
    }
}
