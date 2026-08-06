namespace SEAL.NET.DTOs.Analytics
{
    public class CriterionReliabilityDto
    {
        public Guid CriteriaId { get; set; }
        public string Criterion { get; set; } = string.Empty;
        public double? Icc { get; set; }
        /// <summary>Krippendorff's alpha — tolerates judges who did not all score everything.</summary>
        public double? Alpha { get; set; }
        public string Agreement { get; set; } = "Insufficient data";
        public double AvgScore { get; set; }
    }

    public class JudgeAverageDto
    {
        public string Judge { get; set; } = string.Empty;
        public double AvgScore { get; set; }
    }

    public class TeamVarianceDto
    {
        public string Team { get; set; } = string.Empty;
        public List<JudgeAverageDto> Judges { get; set; } = [];
    }

    public class CriterionAverageDto
    {
        public string Criterion { get; set; } = string.Empty;
        public double AvgScore { get; set; }
    }

    public class AnonymousScoreDatasetRowDto
    {
        public string Event { get; set; } = string.Empty;
        public string Round { get; set; } = string.Empty;
        public string SubmissionCode { get; set; } = string.Empty;
        public string JudgeCode { get; set; } = string.Empty;
        public string JudgeType { get; set; } = string.Empty;
        public string Criterion { get; set; } = string.Empty;
        public double Score { get; set; }
        public double MaxScore { get; set; }
        public double Weight { get; set; }
    }

    /// <summary>
    /// Reliability for one group of criteria or judges, used for the RQ2 and RQ3
    /// comparisons. <see cref="Group"/> carries the enum name, including
    /// "Unspecified" for records nobody has labelled yet — reported rather than
    /// hidden, so it is obvious when a comparison rests on partial data.
    /// </summary>
    public class GroupReliabilityDto
    {
        public string Group { get; set; } = string.Empty;
        public double? Icc { get; set; }
        public double? Alpha { get; set; }
        public double AvgScore { get; set; }
        public int ScoreCount { get; set; }
    }

    public class InterRaterAnalyticsDto
    {
        public double? OverallIcc { get; set; }
        /// <summary>Alpha over every score, the headline RQ1 figure beside OverallIcc.</summary>
        public double? OverallAlpha { get; set; }
        public int JudgeCount { get; set; }
        public int SubmissionCount { get; set; }
        public int CriteriaCount { get; set; }
        public List<CriterionReliabilityDto> ByCriterion { get; set; } = [];

        /// <summary>RQ2: agreement on technical versus subjective criteria.</summary>
        public List<GroupReliabilityDto> ByCriterionType { get; set; } = [];

        /// <summary>RQ3: agreement among faculty judges versus invited guests.</summary>
        public List<GroupReliabilityDto> ByJudgeType { get; set; } = [];
        public List<TeamVarianceDto> Variance { get; set; } = [];
        public List<CriterionAverageDto> CriterionAverages { get; set; } = [];
        public List<AnonymousScoreDatasetRowDto> AnonymousScores { get; set; } = [];
    }
}
