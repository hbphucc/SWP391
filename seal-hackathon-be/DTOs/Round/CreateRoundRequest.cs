using SEAL.NET.DTOs.Criteria;
using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Round
{
    public class CreateRoundRequest
    {
        [Required, MaxLength(100)]
        public string RoundName { get; set; } = string.Empty;

        [Required]
        public DateTime SubmissionDeadline { get; set; }

        [Required]
        public int RoundOrder { get; set; }

        public int MaxTeamsAdvancing { get; set; } = 0;

        /// <summary>
        /// Optional minimum weighted score to advance. Null = auto-derive from criteria weights.
        /// </summary>
        public decimal? PassThreshold { get; set; }

        public Guid? PromptDocumentId { get; set; }

        /// <summary>
        /// Optional scoring criteria to create together with the round (only honored
        /// when the round is created via POST /api/events, i.e. atomically with its
        /// event). When empty, criteria can be added later via POST /rounds/{id}/criteria.
        /// </summary>
        public List<CreateCriteriaRequest> Criteria { get; set; } = [];
    }
}
