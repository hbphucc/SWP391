using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Models.Entities
{
    public class Criteria
    {
        public Guid CriteriaId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string CriteriaName { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Weight { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal MaxScore { get; set; }

        /// <summary>
        /// Technical or subjective. Drives the RQ2 comparison of inter-rater
        /// agreement between the two kinds of criterion; Unspecified keeps a
        /// criterion out of that comparison rather than guessing its group.
        /// </summary>
        public CriterionType CriterionType { get; set; } = CriterionType.Unspecified;

        public Guid RoundId { get; set; }
        public Round Round { get; set; } = null!;

        public List<Score> Scores { get; set; } = [];
    }
}
