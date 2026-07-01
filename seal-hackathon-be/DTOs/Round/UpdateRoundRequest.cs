using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Round
{
    public class UpdateRoundRequest
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
    }
}