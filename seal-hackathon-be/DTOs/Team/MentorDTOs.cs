using System;

namespace SEAL.NET.DTOs.Team
{
    public class ChooseMentorRequest
    {
        public Guid MentorUserId { get; set; }
    }

    /// <summary>Step one: puts a mentor on a round, before any team is chosen.</summary>
    public class AssignMentorToRoundRequest
    {
        public Guid MentorUserId { get; set; }
        public Guid RoundId { get; set; }
    }

    /// <summary>Step two: points a mentor at one team within a round.</summary>
    public class AssignMentorRequest
    {
        public Guid MentorUserId { get; set; }
        public Guid RoundId { get; set; }
        public Guid TeamId { get; set; }
    }

    /// <summary>Assigns a mentor to every team currently in a Track (Category).</summary>
    public class AssignMentorToCategoryRequest
    {
        public Guid MentorUserId { get; set; }
        public Guid RoundId { get; set; }
        public Guid CategoryId { get; set; }
    }

    public class MentorAssignmentResponseDto
    {
        public Guid Id { get; set; }
        public Guid MentorUserId { get; set; }
        public string MentorName { get; set; } = string.Empty;
        public string MentorEmail { get; set; } = string.Empty;
        public Guid? RoundId { get; set; }
        public string? RoundName { get; set; }
        // Null while the mentor is on the round but no team has been picked yet.
        public Guid? TeamId { get; set; }
        public string? TeamName { get; set; }
        public string? AssignedByName { get; set; }
        public DateTime AssignedAt { get; set; }
        public bool IsActive { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class MentorTeamResponseDto
    {
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        // The same team can appear twice when a mentor covers it across two rounds,
        // so the round is what tells those rows apart.
        public Guid? RoundId { get; set; }
        public string? RoundName { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string EventName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int MembersCount { get; set; }
        public string? Notes { get; set; }
        public MentorTeamSubmissionDto? LatestSubmission { get; set; }
    }

    public class MentorTeamSubmissionDto
    {
        public Guid SubmissionId { get; set; }
        public string? RepositoryUrl { get; set; }
        public string? DemoUrl { get; set; }
        public string? SlideUrl { get; set; }
        public DateTime SubmittedAt { get; set; }
        public string RoundName { get; set; } = string.Empty;
    }

    public class SaveNotesRequest
    {
        public string? Notes { get; set; }
    }
}
