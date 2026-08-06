using System.ComponentModel.DataAnnotations;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.DTOs.Criteria
{
    public class CriteriaTemplateDto
    {
        public Guid CriteriaTemplateId { get; set; }
        public string CriteriaName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Weight { get; set; }
        public decimal MaxScore { get; set; }
        public CriterionType CriterionType { get; set; }
        public int DisplayOrder { get; set; }
    }

    public class SaveCriteriaTemplateRequest
    {
        [Required, MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Range(0, 100)]
        public decimal Weight { get; set; }

        [Range(0, 100)]
        public decimal MaxScore { get; set; } = 100;

        public CriterionType CriterionType { get; set; } = CriterionType.Unspecified;

        public int DisplayOrder { get; set; }
    }

    public class ApplyCriteriaTemplateRequest
    {
        /// <summary>Templates to copy onto the round, in the order given.</summary>
        public List<Guid> TemplateIds { get; set; } = [];

        /// <summary>
        /// Replace the round's existing criteria instead of adding to them. Refused
        /// when scores already exist, since that would orphan them.
        /// </summary>
        public bool Replace { get; set; }
    }
}
