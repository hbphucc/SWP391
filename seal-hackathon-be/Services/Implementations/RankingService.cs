using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class RankingService : IRankingService
    {
        private readonly ApplicationDbContext _context;

        public RankingService(ApplicationDbContext context)
        {
            _context = context;
        }

        private decimal CalculateSubmissionScore(Submission submission)
        {
            var judgeScores = submission.Scores
                .GroupBy(sc => sc.JudgeId)
                .Select(g => g.Sum(sc =>
                    sc.Criteria == null || sc.Criteria.MaxScore == 0
                        ? 0
                        : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight))
                .ToList();
            return judgeScores.Any() ? judgeScores.Average() : 0m;
        }

        public async Task<object> GetRoundRankingAsync(Guid roundId)
        {
            var currentRound = await _context.Rounds.FirstOrDefaultAsync(r => r.RoundId == roundId);
            if (currentRound == null) return new List<object>();

            var isFinalRound = !await _context.Rounds.AnyAsync(r => r.EventId == currentRound.EventId && r.RoundOrder > currentRound.RoundOrder);

            if (isFinalRound)
            {
                var allRounds = await _context.Rounds
                    .Where(r => r.EventId == currentRound.EventId)
                    .ToListAsync();

                var submissions = await _context.Submissions
                    .Include(s => s.Team)
                        .ThenInclude(t => t!.Category)
                    .Include(s => s.Team)
                        .ThenInclude(t => t!.Submissions)
                            .ThenInclude(sub => sub.Scores)
                                .ThenInclude(sc => sc.Criteria)
                    .Where(s => s.RoundId == roundId)
                    .ToListAsync();

                var teamResults = new List<dynamic>();

                foreach (var sub in submissions)
                {
                    var team = sub.Team;
                    if (team == null) continue;

                    decimal totalRoundsScore = 0;
                    foreach (var round in allRounds)
                    {
                        var roundSub = team.Submissions.FirstOrDefault(s => s.RoundId == round.RoundId);
                        decimal roundScore = 0;
                        if (roundSub != null)
                        {
                            roundScore = CalculateSubmissionScore(roundSub);
                        }
                        totalRoundsScore += roundScore;
                    }

                    decimal averageScore = allRounds.Count > 0 ? totalRoundsScore / allRounds.Count : 0m;

                    teamResults.Add(new
                    {
                        sub.SubmissionId,
                        teamId = team.TeamId,
                        teamName = team.TeamName,
                        categoryName = team.Category?.CategoryName ?? string.Empty,
                        totalScore = averageScore,
                        submittedAt = sub.SubmittedAt
                    });
                }

                var sortedResults = teamResults
                    .OrderByDescending(x => x.totalScore)
                    .ThenBy(x => x.submittedAt)
                    .ToList();

                return sortedResults.Select((r, index) => new
                {
                    rank = index + 1,
                    r.SubmissionId,
                    r.teamId,
                    r.teamName,
                    r.categoryName,
                    r.totalScore,
                    r.submittedAt
                });
            }
            else
            {
                var submissions = await _context.Submissions
                    .Include(s => s.Team)
                        .ThenInclude(t => t!.Category)
                    .Include(s => s.Scores)
                        .ThenInclude(sc => sc.Criteria)
                    .Where(s => s.RoundId == roundId)
                    .ToListAsync();

                var teamResults = submissions.Select(s => new
                {
                    s.SubmissionId,
                    teamId = s.Team!.TeamId,
                    teamName = s.Team.TeamName,
                    categoryName = s.Team.Category?.CategoryName ?? string.Empty,
                    totalScore = CalculateSubmissionScore(s),
                    submittedAt = s.SubmittedAt
                })
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToList();

                return teamResults.Select((r, index) => new
                {
                    rank = index + 1,
                    r.SubmissionId,
                    r.teamId,
                    r.teamName,
                    r.categoryName,
                    r.totalScore,
                    r.submittedAt
                });
            }
        }

        public async Task<object> GetCategoryRoundRankingAsync(Guid categoryId, Guid roundId)
        {
            var currentRound = await _context.Rounds.FirstOrDefaultAsync(r => r.RoundId == roundId);
            if (currentRound == null) return new List<object>();

            var isFinalRound = !await _context.Rounds.AnyAsync(r => r.EventId == currentRound.EventId && r.RoundOrder > currentRound.RoundOrder);

            if (isFinalRound)
            {
                var allRounds = await _context.Rounds
                    .Where(r => r.EventId == currentRound.EventId)
                    .ToListAsync();

                var submissions = await _context.Submissions
                    .Include(s => s.Team)
                    .Include(s => s.Team)
                        .ThenInclude(t => t!.Submissions)
                            .ThenInclude(sub => sub.Scores)
                                .ThenInclude(sc => sc.Criteria)
                    .Where(s => s.RoundId == roundId && s.Team!.CategoryId == categoryId)
                    .ToListAsync();

                var teamResults = new List<dynamic>();

                foreach (var sub in submissions)
                {
                    var team = sub.Team;
                    if (team == null) continue;

                    decimal totalRoundsScore = 0;
                    foreach (var round in allRounds)
                    {
                        var roundSub = team.Submissions.FirstOrDefault(s => s.RoundId == round.RoundId);
                        decimal roundScore = 0;
                        if (roundSub != null)
                        {
                            roundScore = CalculateSubmissionScore(roundSub);
                        }
                        totalRoundsScore += roundScore;
                    }

                    decimal averageScore = allRounds.Count > 0 ? totalRoundsScore / allRounds.Count : 0m;

                    teamResults.Add(new
                    {
                        sub.SubmissionId,
                        teamId = team.TeamId,
                        teamName = team.TeamName,
                        totalScore = averageScore,
                        submittedAt = sub.SubmittedAt
                    });
                }

                var sortedResults = teamResults
                    .OrderByDescending(x => x.totalScore)
                    .ThenBy(x => x.submittedAt)
                    .ToList();

                return sortedResults.Select((r, index) => new
                {
                    rank = index + 1,
                    r.SubmissionId,
                    r.teamId,
                    r.teamName,
                    r.totalScore,
                    r.submittedAt
                });
            }
            else
            {
                var submissions = await _context.Submissions
                    .Include(s => s.Team)
                    .Include(s => s.Scores)
                        .ThenInclude(sc => sc.Criteria)
                    .Where(s => s.RoundId == roundId && s.Team!.CategoryId == categoryId)
                    .ToListAsync();

                var teamResults = submissions.Select(s => new
                {
                    s.SubmissionId,
                    teamId = s.Team!.TeamId,
                    teamName = s.Team.TeamName,
                    totalScore = CalculateSubmissionScore(s),
                    submittedAt = s.SubmittedAt
                })
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToList();

                return teamResults.Select((r, index) => new
                {
                    rank = index + 1,
                    r.SubmissionId,
                    r.teamId,
                    r.teamName,
                    r.totalScore,
                    r.submittedAt
                });
            }
        }

        public async Task<object> GetEventOverallRankingAsync(Guid eventId)
        {
            var allRounds = await _context.Rounds
                .Where(r => r.EventId == eventId)
                .ToListAsync();

            var teams = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.Submissions)
                    .ThenInclude(s => s.Scores)
                        .ThenInclude(sc => sc.Criteria)
                .Where(t => t.Category.EventId == eventId && t.Status != TeamStatus.Pending && t.Status != TeamStatus.Rejected)
                .ToListAsync();

            var teamResults = new List<dynamic>();

            foreach (var team in teams)
            {
                decimal totalRoundsScore = 0;
                DateTime? lastSubmittedAt = null;

                foreach (var round in allRounds)
                {
                    var roundSub = team.Submissions.FirstOrDefault(s => s.RoundId == round.RoundId);
                    decimal roundScore = 0;
                    if (roundSub != null)
                    {
                        roundScore = CalculateSubmissionScore(roundSub);
                        if (lastSubmittedAt == null || roundSub.SubmittedAt > lastSubmittedAt)
                        {
                            lastSubmittedAt = roundSub.SubmittedAt;
                        }
                    }
                    totalRoundsScore += roundScore;
                }

                decimal averageScore = allRounds.Count > 0 ? totalRoundsScore / allRounds.Count : 0m;

                teamResults.Add(new
                {
                    SubmissionId = team.TeamId,
                    teamId = team.TeamId,
                    teamName = team.TeamName,
                    categoryName = team.Category?.CategoryName ?? string.Empty,
                    totalScore = averageScore,
                    submittedAt = lastSubmittedAt ?? team.CreatedAt
                });
            }

            var sortedResults = teamResults
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToList();

            return sortedResults.Select((r, index) => new
            {
                rank = index + 1,
                r.SubmissionId,
                r.teamId,
                r.teamName,
                r.categoryName,
                r.totalScore,
                r.submittedAt
            });
        }

        public async Task<object> GetCategoryEventOverallRankingAsync(Guid categoryId, Guid eventId)
        {
            var allRounds = await _context.Rounds
                .Where(r => r.EventId == eventId)
                .ToListAsync();

            var teams = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.Submissions)
                    .ThenInclude(s => s.Scores)
                        .ThenInclude(sc => sc.Criteria)
                .Where(t => t.CategoryId == categoryId && t.Status != TeamStatus.Pending && t.Status != TeamStatus.Rejected)
                .ToListAsync();

            var teamResults = new List<dynamic>();

            foreach (var team in teams)
            {
                decimal totalRoundsScore = 0;
                DateTime? lastSubmittedAt = null;

                foreach (var round in allRounds)
                {
                    var roundSub = team.Submissions.FirstOrDefault(s => s.RoundId == round.RoundId);
                    decimal roundScore = 0;
                    if (roundSub != null)
                    {
                        roundScore = CalculateSubmissionScore(roundSub);
                        if (lastSubmittedAt == null || roundSub.SubmittedAt > lastSubmittedAt)
                        {
                            lastSubmittedAt = roundSub.SubmittedAt;
                        }
                    }
                    totalRoundsScore += roundScore;
                }

                decimal averageScore = allRounds.Count > 0 ? totalRoundsScore / allRounds.Count : 0m;

                teamResults.Add(new
                {
                    SubmissionId = team.TeamId,
                    teamId = team.TeamId,
                    teamName = team.TeamName,
                    totalScore = averageScore,
                    submittedAt = lastSubmittedAt ?? team.CreatedAt
                });
            }

            var sortedResults = teamResults
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToList();

            return sortedResults.Select((r, index) => new
            {
                rank = index + 1,
                r.SubmissionId,
                r.teamId,
                r.teamName,
                r.totalScore,
                r.submittedAt
            });
        }
    }
}
