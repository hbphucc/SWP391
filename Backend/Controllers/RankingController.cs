using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;

namespace SEAL.NET.Controllers
{
    [Route("api/ranking")]
    [ApiController]
    [Authorize]
    public class RankingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RankingController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("round/{roundId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoundRanking(Guid roundId)
        {
            var ranking = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Criteria)
                .Where(s => s.RoundId == roundId)
                .Select(s => new
                {
                    s.SubmissionId,
                    teamId = s.Team!.TeamId,
                    teamName = s.Team.TeamName,
                    categoryName = s.Team.Category!.CategoryName,
                    totalScore = s.Scores.Sum(sc =>
                        sc.Criteria == null || sc.Criteria.MaxScore == 0
                            ? 0
                            : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight),
                    submittedAt = s.SubmittedAt
                })
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToListAsync();

            var result = ranking.Select((r, index) => new
            {
                rank = index + 1,
                r.SubmissionId,
                r.teamId,
                r.teamName,
                r.categoryName,
                r.totalScore,
                r.submittedAt
            });

            return Ok(result);
        }

        [HttpGet("category/{categoryId}/round/{roundId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategoryRoundRanking(Guid categoryId, Guid roundId)
        {
            var ranking = await _context.Submissions
                .Include(s => s.Team)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Criteria)
                .Where(s =>
                    s.RoundId == roundId &&
                    s.Team!.CategoryId == categoryId)
                .Select(s => new
                {
                    s.SubmissionId,
                    teamId = s.Team!.TeamId,
                    teamName = s.Team.TeamName,
                    totalScore = s.Scores.Sum(sc =>
                        sc.Criteria == null || sc.Criteria.MaxScore == 0
                            ? 0
                            : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight),
                    submittedAt = s.SubmittedAt
                })
                .OrderByDescending(x => x.totalScore)
                .ThenBy(x => x.submittedAt)
                .ToListAsync();

            var result = ranking.Select((r, index) => new
            {
                rank = index + 1,
                r.SubmissionId,
                r.teamId,
                r.teamName,
                r.totalScore,
                r.submittedAt
            });

            return Ok(result);
        }
    }
}