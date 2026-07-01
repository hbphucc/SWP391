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
        ///  - teamsInRound: active (Approved) teams whose CurrentRoundId is this round.
        ///  - activeJudgeCount: distinct judges with at least one JudgeAssignment in this round.
        ///  - activeMentorCount: distinct mentors with an active MentorAssignment on a team
        ///    currently in this round. Mentor assignments are not round-scoped in the schema,
        ///    so this answers "how many mentors are actively coaching teams that are in this
        ///    round right now" — useful for staffing visibility, not a per-round attribution.
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

            // One grouped query per dimension is cheaper than N round-specific queries.
            var judgeCounts = await _context.JudgeAssignments
                .Where(ja => ja.Round.EventId == eventId)
                .GroupBy(ja => ja.RoundId)
                .Select(g => new { RoundId = g.Key, Count = g.Select(x => x.JudgeId).Distinct().Count() })
                .ToDictionaryAsync(x => x.RoundId, x => x.Count);

            var teamsByRound = await _context.Teams
                .Where(t => t.CurrentRoundId != null
                            && t.Category.EventId == eventId
                            && t.Status == TeamStatus.Approved)
                .GroupBy(t => t.CurrentRoundId!.Value)
                .Select(g => new { RoundId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.RoundId, x => x.Count);

            // MentorAssignment has no RoundId — we attribute mentors via the team's
            // current round. Same mentor on two teams in the same round counts once.
            var mentorsByRound = await _context.MentorAssignments
                .Where(ma => ma.IsActive
                             && ma.Team.CurrentRoundId != null
                             && ma.Team.Category.EventId == eventId
                             && ma.Team.Status == TeamStatus.Approved)
                .GroupBy(ma => ma.Team.CurrentRoundId!.Value)
                .Select(g => new { RoundId = g.Key, Count = g.Select(ma => ma.MentorUserId).Distinct().Count() })
                .ToDictionaryAsync(x => x.RoundId, x => x.Count);

            var result = rounds.Select(r => new
            {
                roundId = r.RoundId,
                roundName = r.RoundName,
                roundOrder = r.RoundOrder,
                teamsInRound = teamsByRound.TryGetValue(r.RoundId, out var t) ? t : 0,
                activeJudgeCount = judgeCounts.TryGetValue(r.RoundId, out var j) ? j : 0,
                activeMentorCount = mentorsByRound.TryGetValue(r.RoundId, out var m) ? m : 0,
            });

            return Ok(result);
        }
    }
}
