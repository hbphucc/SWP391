using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Services.Common;
using SEAL.NET.Models.Enums;
using SEAL.NET.DTOs.Analytics;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AnalyticsService : IAnalyticsService
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InterRaterAnalyticsDto> GetInterRaterAsync(Guid? eventId)
        {
            var query = _context.Scores.AsNoTracking()
                .Include(s => s.Criteria)
                .Include(s => s.Judge)
                .Include(s => s.Submission!).ThenInclude(sub => sub.Team)
                .Include(s => s.Submission!).ThenInclude(sub => sub.Round).ThenInclude(round => round.Event)
                .AsQueryable();

            if (eventId.HasValue)
                query = query.Where(s => s.Submission!.Round.EventId == eventId.Value);

            var scores = await query
                .Select(s => new ScoreRow
                {
                    CriteriaId = s.CriteriaId,
                    CriteriaName = s.Criteria!.CriteriaName,
                    MaxScore = (double)s.Criteria.MaxScore,
                    Weight = (double)s.Criteria.Weight,
                    SubmissionId = s.SubmissionId,
                    TeamName = s.Submission!.Team.TeamName,
                    EventName = s.Submission.Round.Event.EventName,
                    RoundName = s.Submission.Round.RoundName,
                    JudgeId = s.JudgeId,
                    JudgeName = s.Judge!.FullName,
                    JudgeEmail = s.Judge.Email ?? string.Empty,
                    CriterionType = s.Criteria.CriterionType,
                    JudgeType = s.Judge.JudgeType,
                    Value = (double)s.ScoreValue
                })
                .ToListAsync();

            var result = new InterRaterAnalyticsDto
            {
                JudgeCount = scores.Select(s => s.JudgeId).Distinct().Count(),
                SubmissionCount = scores.Select(s => s.SubmissionId).Distinct().Count(),
                CriteriaCount = scores.Select(s => s.CriteriaId).Distinct().Count()
            };

            // ICC + average per criterion
            foreach (var group in scores.GroupBy(s => new { s.CriteriaId, s.CriteriaName }))
            {
                var icc = ComputeOneWayIcc(group.Select(g => (g.SubmissionId, g.Value)));
                result.ByCriterion.Add(new CriterionReliabilityDto
                {
                    CriteriaId = group.Key.CriteriaId,
                    Criterion = group.Key.CriteriaName,
                    Icc = icc,
                    Alpha = ComputeAlpha(group),
                    Agreement = AgreementLabel(icc),
                    AvgScore = Math.Round(group.Average(g => g.Value), 2)
                });

                result.CriterionAverages.Add(new CriterionAverageDto
                {
                    Criterion = group.Key.CriteriaName,
                    AvgScore = Math.Round(group.Average(g => g.Value), 2)
                });
            }

            var validIccs = result.ByCriterion.Where(c => c.Icc.HasValue).Select(c => c.Icc!.Value).ToList();
            result.OverallIcc = validIccs.Count > 0 ? Math.Round(validIccs.Average(), 3) : (double?)null;

            var overallAlpha = ComputeAlpha(scores);
            result.OverallAlpha = overallAlpha.HasValue ? Math.Round(overallAlpha.Value, 3) : null;

            // RQ2 / RQ3. Both pool every score in the group and run the same ICC over
            // it, so the two numbers are directly comparable. Unspecified is reported
            // as its own row instead of being folded into either side.
            result.ByCriterionType = scores
                .GroupBy(s => s.CriterionType)
                .OrderBy(g => g.Key)
                .Select(g => BuildGroupReliability(g.Key.ToString(), g))
                .ToList();

            result.ByJudgeType = scores
                .GroupBy(s => s.JudgeType)
                .OrderBy(g => g.Key)
                .Select(g => BuildGroupReliability(g.Key.ToString(), g))
                .ToList();

            var submissionCodes = scores
                .Select(s => s.SubmissionId)
                .Distinct()
                .Select((id, index) => new { id, code = $"SUB-{index + 1:000}" })
                .ToDictionary(item => item.id, item => item.code);

            var judgeCodes = scores
                .Select(s => s.JudgeId)
                .Distinct()
                .Select((id, index) => new { id, code = $"JDG-{index + 1:000}" })
                .ToDictionary(item => item.id, item => item.code);

            result.AnonymousScores = scores
                .OrderBy(s => s.EventName)
                .ThenBy(s => s.RoundName)
                .ThenBy(s => submissionCodes[s.SubmissionId])
                .ThenBy(s => judgeCodes[s.JudgeId])
                .ThenBy(s => s.CriteriaName)
                .Select(s => new AnonymousScoreDatasetRowDto
                {
                    Event = s.EventName,
                    Round = s.RoundName,
                    SubmissionCode = submissionCodes[s.SubmissionId],
                    JudgeCode = judgeCodes[s.JudgeId],
                    JudgeType = s.JudgeType.ToString(),
                    Criterion = s.CriteriaName,
                    Score = Math.Round(s.Value, 2),
                    MaxScore = Math.Round(s.MaxScore, 2),
                    Weight = Math.Round(s.Weight, 2)
                })
                .ToList();

            // Variance per team across judges (avg score each judge gave the team, across criteria)
            result.Variance = scores
                .GroupBy(s => s.SubmissionId)
                .Take(10)
                .Select(subGroup => new TeamVarianceDto
                {
                    Team = $"{subGroup.First().TeamName} - {subGroup.First().RoundName} ({submissionCodes[subGroup.Key]})",
                    Judges = subGroup
                        .GroupBy(s => new { s.JudgeId, s.JudgeName })
                        .Select(jg => new JudgeAverageDto
                        {
                            Judge = jg.Key.JudgeName,
                            AvgScore = Math.Round(jg.Average(g => g.Value), 2)
                        })
                        .ToList()
                })
                .ToList();

            return result;
        }


        /// <summary>
        /// Score spread for a calibration round, shown back to the judges so they can
        /// see where they diverge and talk it through before real judging starts.
        /// </summary>
        public async Task<CalibrationDistributionDto?> GetCalibrationDistributionAsync(
            Guid roundId, Guid? currentUserId, bool isAdmin)
        {
            var round = await _context.Rounds.AsNoTracking()
                .FirstOrDefaultAsync(r => r.RoundId == roundId);

            if (round == null) return null;

            // Only ever a calibration round. Without this a judge could pass a real
            // round's id and read every other judge's live scores, which both breaks
            // independent marking and contaminates the inter-rater data the research
            // depends on.
            if (!round.IsCalibration) return null;

            // And only a judge actually on that round. Admins oversee, so they are
            // exempt; anyone else is treated as if the round did not exist.
            if (!isAdmin)
            {
                if (currentUserId == null) return null;

                var onThisRound = await _context.JudgeAssignments
                    .AnyAsync(a => a.RoundId == roundId && a.JudgeId == currentUserId.Value);

                if (!onThisRound) return null;
            }

            var rows = await _context.Scores.AsNoTracking()
                .Include(s => s.Criteria)
                .Include(s => s.Judge)
                .Where(s => s.Submission!.RoundId == roundId)
                .Select(s => new
                {
                    s.CriteriaId,
                    CriterionName = s.Criteria!.CriteriaName,
                    s.Criteria.MaxScore,
                    s.JudgeId,
                    JudgeName = s.Judge!.FullName,
                    s.ScoreValue
                })
                .ToListAsync();

            var result = new CalibrationDistributionDto
            {
                RoundId = round.RoundId,
                RoundName = round.RoundName,
                IsCalibration = round.IsCalibration,
                JudgeCount = rows.Select(r => r.JudgeId).Distinct().Count()
            };

            result.ByCriterion = rows
                .GroupBy(r => new { r.CriteriaId, r.CriterionName, r.MaxScore })
                .Select(g =>
                {
                    var values = g.Select(x => x.ScoreValue).ToList();
                    return new CalibrationCriterionDto
                    {
                        CriteriaId = g.Key.CriteriaId,
                        Criterion = g.Key.CriterionName,
                        MaxScore = g.Key.MaxScore,
                        Min = values.Min(),
                        Max = values.Max(),
                        Mean = Math.Round(values.Average(), 2),
                        Spread = values.Max() - values.Min(),
                        Scores = g
                            // A judge may have scored more than one sample submission
                            // in the round; average so each judge appears once.
                            .GroupBy(x => new { x.JudgeId, x.JudgeName })
                            .Select(jg => new CalibrationJudgeScoreDto
                            {
                                Judge = jg.Key.JudgeName,
                                Score = Math.Round(jg.Average(x => x.ScoreValue), 2)
                            })
                            .OrderByDescending(j => j.Score)
                            .ToList()
                    };
                })
                // Widest disagreement first — that is what needs discussing.
                .OrderByDescending(c => c.Spread)
                .ToList();

            return result;
        }

        private static string AgreementLabel(double? icc)
        {
            if (!icc.HasValue) return "Insufficient data";
            if (icc.Value >= 0.8) return "Very High";
            if (icc.Value >= 0.7) return "High";
            if (icc.Value >= 0.5) return "Moderate";
            return "Low";
        }


        // One-way random effects ICC(1) from (target, rating) pairs.
        private static double? ComputeOneWayIcc(IEnumerable<(Guid Target, double Value)> data)
        {
            var groups = data
                .GroupBy(d => d.Target)
                .Select(g => g.Select(x => x.Value).ToList())
                .Where(g => g.Count > 0)
                .ToList();

            int k = groups.Count;                 // number of targets (submissions)
            int n = groups.Sum(g => g.Count);     // total ratings
            if (k < 2 || n <= k) return null;     // need multiple targets and within-group ratings

            double grandMean = groups.SelectMany(g => g).Average();

            double ssb = groups.Sum(g => g.Count * Math.Pow(g.Average() - grandMean, 2));
            double ssw = groups.Sum(g => g.Sum(v => Math.Pow(v - g.Average(), 2)));

            double dfb = k - 1;
            double dfw = n - k;
            if (dfw <= 0) return null;

            double msb = ssb / dfb;
            double msw = ssw / dfw;

            // average group size adjusted (n0)
            double sumSq = groups.Sum(g => (double)g.Count * g.Count);
            double n0 = (n - sumSq / n) / (k - 1);
            if (n0 <= 0) return null;

            double denom = msb + (n0 - 1) * msw;
            if (Math.Abs(denom) < 1e-9) return null;

            double icc = (msb - msw) / denom;
            if (icc < 0) icc = 0;           // negative ICC has no practical meaning
            if (icc > 1) icc = 1;
            return Math.Round(icc, 3);
        }

        /// Normalises each raw score to its criterion's own 0..1 scale before pooling,
        /// so a group mixing a 10-point and a 100-point criterion is not dominated by
        /// the larger scale.
        /// Alpha's unit of analysis is one submission judged on one criterion — the
        /// thing several judges rated independently. Scores are normalised to their
        /// criterion's own scale first so pooled groups are not skewed by a
        /// criterion that happens to be marked out of 100 instead of 10.
        private static double? ComputeAlpha(IEnumerable<ScoreRow> rows)
        {
            var units = rows
                .Where(r => r.MaxScore > 0)
                .GroupBy(r => new { r.SubmissionId, r.CriteriaId })
                .Select(g => (IReadOnlyList<double>)g.Select(r => r.Value / r.MaxScore).ToList())
                .ToList();

            return KrippendorffAlpha.ComputeInterval(units);
        }

        private static GroupReliabilityDto BuildGroupReliability(string group, IEnumerable<ScoreRow> rows)
        {
            var list = rows.ToList();
            var normalised = list
                .Where(r => r.MaxScore > 0)
                .Select(r => (r.SubmissionId, Value: r.Value / r.MaxScore))
                .ToList();

            var icc = ComputeOneWayIcc(normalised);
            var groupAlpha = ComputeAlpha(list);

            return new GroupReliabilityDto
            {
                Group = group,
                Icc = icc.HasValue ? Math.Round(icc.Value, 3) : null,
                Alpha = groupAlpha.HasValue ? Math.Round(groupAlpha.Value, 3) : null,
                AvgScore = list.Count > 0 ? Math.Round(list.Average(r => r.Value), 2) : 0,
                ScoreCount = list.Count
            };
        }

        private class ScoreRow
        {
            public Guid CriteriaId { get; set; }
            public string CriteriaName { get; set; } = string.Empty;
            public double MaxScore { get; set; }
            public double Weight { get; set; }
            public Guid SubmissionId { get; set; }
            public string TeamName { get; set; } = string.Empty;
            public string EventName { get; set; } = string.Empty;
            public string RoundName { get; set; } = string.Empty;
            public Guid JudgeId { get; set; }
            public string JudgeName { get; set; } = string.Empty;
            public string JudgeEmail { get; set; } = string.Empty;
            public CriterionType CriterionType { get; set; }
            public JudgeType JudgeType { get; set; }
            public double Value { get; set; }
        }
    }
}
