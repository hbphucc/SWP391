using System.ComponentModel.DataAnnotations;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.DTOs.Criteria
{
    public class UpdateCriteriaRequest
    {
        [Required, MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        [Range(0, 100)]
        public decimal MaxScore { get; set; }

        [Range(0, 100)]
        public decimal Weight { get; set; }

        /// <summary>Technical or Soft; omit to leave the criterion unlabelled.</summary>
        public CriterionType CriterionType { get; set; } = CriterionType.Unspecified;
    }
}