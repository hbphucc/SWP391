using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Criteria
{
    public class CreateCriteriaRequest
    {
        [Required, MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        [Range(0, 100)]
        public decimal MaxScore { get; set; }

        [Range(0, 100)]
        public decimal Weight { get; set; }
    }
}