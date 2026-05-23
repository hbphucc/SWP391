using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Score
{
    public class CreateScoreRequest
    {
        [Required]
        public Guid SubmissionId { get; set; }

        [Required]
        public Guid CriteriaId { get; set; }

        [Range(0, 100)]
        public decimal ScoreValue { get; set; }

        public string? Comment { get; set; }
    }
}