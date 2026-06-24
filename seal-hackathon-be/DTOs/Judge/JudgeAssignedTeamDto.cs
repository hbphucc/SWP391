namespace SEAL.NET.DTOs.Judge
{
    /// <summary>
    /// One row in the judge's assigned-teams list. Combines the team, its
    /// submission (if any) for the assigned round, and the current judge's own
    /// scoring progress. Statuses are the canonical derived values shared across
    /// the judge UI (see <see cref="JudgingStatuses"/>).
    /// </summary>
    public class JudgeAssignedTeamDto
    {
        public Guid TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;

        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string EventStatus { get; set; } = string.Empty;

        public Guid RoundId { get; set; }
        public string RoundName { get; set; } = string.Empty;
        public DateTime? RoundDeadline { get; set; }

        public Guid? SubmissionId { get; set; }
        public string? ProjectName { get; set; }
        public DateTime? SubmittedAt { get; set; }
        public string? RepositoryUrl { get; set; }
        public string? DemoUrl { get; set; }
        public string? SlideUrl { get; set; }

        /// <summary>"Submitted" | "NotSubmitted"</summary>
        public string SubmissionStatus { get; set; } = JudgingStatuses.NotSubmitted;

        /// <summary>"NotSubmitted" | "NotJudged" | "InProgress" | "Judged"</summary>
        public string JudgingStatus { get; set; } = JudgingStatuses.NotSubmitted;

        /// <summary>Persistence state of the current judge's scores: "None" | "Draft" | "Locked".</summary>
        public string ScoreState { get; set; } = JudgingStatuses.ScoreNone;

        /// <summary>Whether this judge's scores for the submission are finalized/locked.</summary>
        public bool IsLocked { get; set; }

        /// <summary>
        /// This judge's weighted score for the submission on a 0–100 scale,
        /// computed as Σ(scoreValue / maxScore × weight). Null until scored.
        /// Matches the per-judge formula used by ranking.
        /// </summary>
        public decimal? MyScore { get; set; }

        public DateTime? LastJudgedAt { get; set; }
    }

    /// <summary>Canonical string values for derived judging/score statuses.</summary>
    public static class JudgingStatuses
    {
        public const string Submitted = "Submitted";
        public const string NotSubmitted = "NotSubmitted";
        public const string NotJudged = "NotJudged";
        public const string InProgress = "InProgress";
        public const string Judged = "Judged";

        public const string ScoreNone = "None";
        public const string ScoreDraft = "Draft";
        public const string ScoreLocked = "Locked";
    }
}
