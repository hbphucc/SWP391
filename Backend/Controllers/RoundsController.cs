using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Round;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Controllers
{
    [Route("api/events/{eventId}/rounds")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class RoundsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public RoundsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetRounds(Guid eventId)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == eventId);
            if (!eventExists)
                return NotFound(new { message = "Event not found." });

            var rounds = await _context.Rounds
                .Where(r => r.EventId == eventId)
                .OrderBy(r => r.RoundOrder)
                .Select(r => new
                {
                    r.RoundId,
                    r.RoundName,
                    r.SubmissionDeadline,
                    r.RoundOrder,
                    r.MaxTeamsAdvancing,
                    r.EventId
                })
                .ToListAsync();

            return Ok(rounds);
        }

        [HttpGet("{roundId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoundById(Guid eventId, Guid roundId)
        {
            var round = await _context.Rounds
                .Where(r => r.EventId == eventId && r.RoundId == roundId)
                .Select(r => new
                {
                    r.RoundId,
                    r.RoundName,
                    r.SubmissionDeadline,
                    r.RoundOrder,
                    r.MaxTeamsAdvancing,
                    r.EventId
                })
                .FirstOrDefaultAsync();

            if (round == null)
                return NotFound(new { message = "Round not found." });

            return Ok(round);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRound(Guid eventId, [FromBody] CreateRoundRequest request)
        {
            var eventItem = await _context.Events.FindAsync(eventId);

            if (eventItem == null)
                return NotFound(new { message = "Event not found." });

            if (request.SubmissionDeadline < eventItem.StartDate || request.SubmissionDeadline > eventItem.EndDate)
                return BadRequest(new { message = "SubmissionDeadline must be within event date range." });

            var duplicateOrder = await _context.Rounds.AnyAsync(r =>
                r.EventId == eventId &&
                r.RoundOrder == request.RoundOrder);

            if (duplicateOrder)
                return BadRequest(new { message = "RoundOrder already exists in this event." });

            var round = new Round
            {
                EventId = eventId,
                RoundName = request.RoundName,
                SubmissionDeadline = request.SubmissionDeadline,
                RoundOrder = request.RoundOrder,
                MaxTeamsAdvancing = request.MaxTeamsAdvancing
            };

            _context.Rounds.Add(round);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRoundById), new
            {
                eventId,
                roundId = round.RoundId
            }, new
            {
                message = "Round created successfully.",
                round.RoundId
            });
        }

        [HttpPut("{roundId}")]
        public async Task<IActionResult> UpdateRound(Guid eventId, Guid roundId, [FromBody] UpdateRoundRequest request)
        {
            var round = await _context.Rounds
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.RoundId == roundId);

            if (round == null)
                return NotFound(new { message = "Round not found." });

            var eventItem = await _context.Events.FindAsync(eventId);

            if (eventItem == null)
                return NotFound(new { message = "Event not found." });

            if (request.SubmissionDeadline < eventItem.StartDate || request.SubmissionDeadline > eventItem.EndDate)
                return BadRequest(new { message = "SubmissionDeadline must be within event date range." });

            var duplicateOrder = await _context.Rounds.AnyAsync(r =>
                r.EventId == eventId &&
                r.RoundId != roundId &&
                r.RoundOrder == request.RoundOrder);

            if (duplicateOrder)
                return BadRequest(new { message = "RoundOrder already exists in this event." });

            round.RoundName = request.RoundName;
            round.SubmissionDeadline = request.SubmissionDeadline;
            round.RoundOrder = request.RoundOrder;
            round.MaxTeamsAdvancing = request.MaxTeamsAdvancing;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Round updated successfully." });
        }

        [HttpDelete("{roundId}")]
        public async Task<IActionResult> DeleteRound(Guid eventId, Guid roundId)
        {
            var round = await _context.Rounds
                .Include(r => r.CriteriaList)
                .Include(r => r.Submissions)
                .Include(r => r.JudgeAssignments)
                .FirstOrDefaultAsync(r => r.EventId == eventId && r.RoundId == roundId);

            if (round == null)
                return NotFound(new { message = "Round not found." });

            if (round.CriteriaList.Any() || round.Submissions.Any() || round.JudgeAssignments.Any())
                return BadRequest(new { message = "Cannot delete round because it already has criteria, submissions, or judge assignments." });

            _context.Rounds.Remove(round);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Round deleted successfully." });
        }
    }
}