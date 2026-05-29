using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/rounds")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminRoundsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminRoundsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("{roundId}/advance")]
        public async Task<IActionResult> AdvanceRound(Guid roundId)
        {
            var currentRound = await _context.Rounds
                .FirstOrDefaultAsync(r => r.RoundId == roundId);

            if (currentRound == null)
                return NotFound(new { message = "Round not found." });

            var nextRound = await _context.Rounds
                .Where(r => r.EventId == currentRound.EventId &&
                            r.RoundOrder > currentRound.RoundOrder)
                .OrderBy(r => r.RoundOrder)
                .FirstOrDefaultAsync();

            if (nextRound == null)
                return BadRequest(new { message = "This is the final round. No next round found." });

            if (currentRound.MaxTeamsAdvancing <= 0)
                return BadRequest(new { message = "MaxTeamsAdvancing must be greater than 0." });

            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Scores)
                    .ThenInclude(sc => sc.Criteria)
                .Where(s =>
                    s.RoundId == roundId &&
                    s.Team != null &&
                    s.Team.Status == TeamStatus.Approved)
                .ToListAsync();

            if (!submissions.Any())
                return BadRequest(new { message = "No submissions found for this round." });

            var groupedByCategory = submissions
                .GroupBy(s => s.Team!.CategoryId);

            var advancedTeams = new List<object>();
            var eliminatedTeams = new List<object>();

            foreach (var categoryGroup in groupedByCategory)
            {
                var rankedSubmissions = categoryGroup
                    .Select(s => new
                    {
                        Submission = s,
                        Team = s.Team!,
                        TotalScore = s.Scores.Sum(sc =>
                            sc.Criteria == null || sc.Criteria.MaxScore == 0
                                ? 0
                                : (sc.ScoreValue / sc.Criteria.MaxScore) * sc.Criteria.Weight)
                    })
                    .OrderByDescending(x => x.TotalScore)
                    .ThenBy(x => x.Submission.SubmittedAt)
                    .ToList();

                var winners = rankedSubmissions
                    .Take(currentRound.MaxTeamsAdvancing)
                    .ToList();

                var losers = rankedSubmissions
                    .Skip(currentRound.MaxTeamsAdvancing)
                    .ToList();

                foreach (var item in winners)
                {
                    item.Team.CurrentRoundId = nextRound.RoundId;
                    item.Team.Status = TeamStatus.Approved;

                    advancedTeams.Add(new
                    {
                        item.Team.TeamId,
                        item.Team.TeamName,
                        categoryId = item.Team.CategoryId,
                        totalScore = item.TotalScore
                    });
                }

                foreach (var item in losers)
                {
                    item.Team.Status = TeamStatus.Eliminated;
                    item.Team.EliminationReason = "Eliminated after round ranking.";
                    item.Team.EliminatedAt = DateTime.UtcNow;

                    eliminatedTeams.Add(new
                    {
                        item.Team.TeamId,
                        item.Team.TeamName,
                        categoryId = item.Team.CategoryId,
                        totalScore = item.TotalScore
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Round advanced successfully.",
                fromRound = new
                {
                    currentRound.RoundId,
                    currentRound.RoundName
                },
                toRound = new
                {
                    nextRound.RoundId,
                    nextRound.RoundName
                },
                advancedTeams,
                eliminatedTeams
            });
        }
    }
}