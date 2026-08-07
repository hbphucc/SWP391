using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Enums;

namespace SEAL.NET.Controllers
{
    /// <summary>
    /// Admin-only analytics endpoints. Inter-rater stats live in <see cref="AnalyticsController"/>;
    /// this controller hosts the per-round mentor/judge rollups the assignments page needs.
    /// </summary>
    [Route("api/admin/analytics")]
    [Route("api/admin/round-summary-reports")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminAnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminAnalyticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Per-round summary for one event. Returns one row per round with:
        ///  - teamsInRound: historical count of teams that participated in / reached this round.
        ///  - activeJudgeCount: distinct judges assigned to this round.
        ///  - activeMentorCount: distinct mentors coaching teams that participated in / reached this round.
        /// </summary>
        [HttpGet("event/{eventId:guid}/round-summary")]
        public async Task<IActionResult> GetRoundSummary(Guid eventId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == eventId);
            if (!eventExists)
                return NotFound(new { message = "Event not found." });

            var rounds = await _context.Rounds
                .Where(r => r.EventId == eventId)
                .OrderBy(r => r.RoundOrder)
                .Select(r => new { r.RoundId, r.RoundName, r.RoundOrder })
                .ToListAsync();

            var judgeCounts = await _context.JudgeAssignments
                .Where(ja => ja.Round.EventId == eventId)
                .GroupBy(ja => ja.RoundId)
                .Select(g => new { RoundId = g.Key, Count = g.Select(x => x.JudgeId).Distinct().Count() })
                .ToDictionaryAsync(x => x.RoundId, x => x.Count);

            var eventTeams = await _context.Teams
                .Include(t => t.CurrentRound)
                .Include(t => t.Submissions)
                .Where(t => t.Category.EventId == eventId)
                .ToListAsync();

            var eventMentorAssignments = await _context.MentorAssignments
                .Include(ma => ma.Team).ThenInclude(t => t!.CurrentRound)
                .Where(ma => ma.IsActive
                             && ((ma.RoundId != null && ma.Round != null && ma.Round.EventId == eventId)
                                 || (ma.TeamId != null && ma.Team != null && ma.Team.Category.EventId == eventId)))
                .ToListAsync();

            var minRoundOrder = rounds.Count > 0 ? rounds.Min(r => r.RoundOrder) : 0;

            var result = rounds.Select(r =>
            {
                var teamsInThisRound = eventTeams.Where(t =>
                    t.Submissions.Any(s => s.RoundId == r.RoundId)
                    || (t.CurrentRound != null && t.CurrentRound.RoundOrder >= r.RoundOrder)
                    || (r.RoundOrder == minRoundOrder)
                ).ToList();

                var teamIdsInThisRound = teamsInThisRound.Select(t => t.TeamId).ToHashSet();

                var mentorsInThisRound = eventMentorAssignments
                    .Where(ma => ma.RoundId == r.RoundId
                                 || (ma.TeamId.HasValue && teamIdsInThisRound.Contains(ma.TeamId.Value)))
                    .Select(ma => ma.MentorUserId)
                    .Distinct()
                    .Count();

                return new
                {
                    roundId = r.RoundId,
                    roundName = r.RoundName,
                    roundOrder = r.RoundOrder,
                    teamsInRound = teamsInThisRound.Count,
                    activeJudgeCount = judgeCounts.TryGetValue(r.RoundId, out var j) ? j : 0,
                    activeMentorCount = mentorsInThisRound,
                };
            });

            return Ok(result);
        }
    }
}
