using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.Models.Entities
{
    public class Round
    {
        public Guid RoundId { get; set; } = Guid.NewGuid();

        [MaxLength(100)]
        public string RoundName { get; set; } = string.Empty;

        public int RoundOrder { get; set; }
        public int MaxTeamsAdvancing { get; set; }
        public DateTime? SubmissionDeadline { get; set; }

        /// <summary>
        /// Optional minimum weighted score a team must reach to advance from this round.
        /// When null, AdvanceRoundAsync derives the threshold from criteria weights
        /// (Sum(Weight) * 0.4), which preserves the legacy "score >= 40 when weights
        /// sum to 100" behavior for rounds created before this column existed.
        /// </summary>
        public decimal? PassThreshold { get; set; }
        
        public Guid? PromptDocumentId { get; set; }
        public Document? PromptDocument { get; set; }

        public Guid EventId { get; set; }
        public Event Event { get; set; } = null!;

        public List<Criteria> CriteriaList { get; set; } = [];
        public List<JudgeAssignment> JudgeAssignments { get; set; } = [];
        public List<Submission> Submissions { get; set; } = [];
    }
}
