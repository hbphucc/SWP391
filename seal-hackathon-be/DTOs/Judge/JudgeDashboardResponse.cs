namespace SEAL.NET.DTOs.Judge
{
    /// <summary>
    /// Aggregated judge dashboard payload. Computed entirely server-side from the
    /// judge's <c>JudgeAssignment</c>s so the frontend needs a single round-trip.
    /// </summary>
    public class JudgeDashboardResponse
    {
        public JudgeDashboardStats Stats { get; set; } = new();
        public List<JudgeEventProgressDto> Events { get; set; } = [];
    }

    public class JudgeDashboardStats
    {
        public int OngoingEvents { get; set; }
        public int OpenRounds { get; set; }
        public int TotalAssignedTeams { get; set; }
        public int JudgedTeams { get; set; }
        public int NotJudgedTeams { get; set; }
        public int NotSubmittedTeams { get; set; }
        public int SubmittedTeams { get; set; }
        public double CompletionPercentage { get; set; }
        public DateTime? NearestDeadline { get; set; }
    }

    public class JudgeEventProgressDto
    {
        public Guid EventId { get; set; }
        public string EventName { get; set; } = string.Empty;
        public string EventStatus { get; set; } = string.Empty;
        public DateTime EventStartDate { get; set; }
        public DateTime EventEndDate { get; set; }

        public Guid? CurrentRoundId { get; set; }
        public string? CurrentRoundName { get; set; }
        public DateTime? JudgingDeadline { get; set; }

        public int AssignedTeams { get; set; }
        public int JudgedTeams { get; set; }
        public int NotJudgedTeams { get; set; }
        public int NotSubmittedTeams { get; set; }
        public double ProgressPercentage { get; set; }
    }
}
