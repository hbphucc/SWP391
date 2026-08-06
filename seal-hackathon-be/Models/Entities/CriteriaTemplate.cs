using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Models.Entities
{
    /// <summary>
    /// A reusable rubric line kept outside any event, so organisers stop retyping
    /// the same criteria for every hackathon.
    ///
    /// Applying a template copies its values onto a round. The copy is deliberate:
    /// once a round is using a criterion, editing the template must not silently
    /// change what judges are already marking against, or what past results were
    /// computed from.
    /// </summary>
    public class CriteriaTemplate
    {
        public Guid CriteriaTemplateId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Weight { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal MaxScore { get; set; }

        public CriterionType CriterionType { get; set; } = CriterionType.Unspecified;

        /// <summary>Lower numbers are offered first when applying a template set.</summary>
        public int DisplayOrder { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
