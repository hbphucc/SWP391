using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Category
{
    public class CreateCategoryRequest
    {
        [Required, MaxLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        public string? Description { get; set; }
    }
}