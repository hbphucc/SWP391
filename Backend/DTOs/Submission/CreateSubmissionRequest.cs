using System.ComponentModel.DataAnnotations;

namespace SEAL.NET.DTOs.Submission
{
    public class CreateSubmissionRequest
    {
        [Required]
        public Guid TeamId { get; set; }

        [Required]
        public Guid RoundId { get; set; }

        [Url]
        public string? RepositoryUrl { get; set; }

        [Url]
        public string? DemoUrl { get; set; }

        [Url]
        public string? SlideUrl { get; set; }
    }
}