namespace SEAL.NET.DTOs.Analytics
{
    /// <summary>How one judge scored one criterion in a calibration round.</summary>
    public class CalibrationJudgeScoreDto
    {
        public string Judge { get; set; } = string.Empty;
        public decimal Score { get; set; }
    }

    /// <summary>
    /// The spread of scores on a single criterion, which is the point of a
    /// calibration round: judges see how far apart they are before real judging.
    /// </summary>
    public class CalibrationCriterionDto
    {
        public Guid CriteriaId { get; set; }
        public string Criterion { get; set; } = string.Empty;
        public decimal MaxScore { get; set; }
        public decimal Min { get; set; }
        public decimal Max { get; set; }
        public decimal Mean { get; set; }
        /// <summary>Max minus min — the headline "how far apart are we" number.</summary>
        public decimal Spread { get; set; }
        public List<CalibrationJudgeScoreDto> Scores { get; set; } = [];
    }

    public class CalibrationDistributionDto
    {
        public Guid RoundId { get; set; }
        public string RoundName { get; set; } = string.Empty;
        public bool IsCalibration { get; set; }
        public int JudgeCount { get; set; }
        public List<CalibrationCriterionDto> ByCriterion { get; set; } = [];
    }
}
