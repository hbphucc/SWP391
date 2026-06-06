using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Prize;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrizesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PrizesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPrizes([FromQuery] Guid? eventId)
        {
            var query = _context.Prizes.AsNoTracking().Include(p => p.Event).AsQueryable();

            if (eventId.HasValue)
                query = query.Where(p => p.EventId == eventId.Value);

            var prizes = await query
                .OrderBy(p => p.Rank)
                .ThenBy(p => p.Title)
                .Select(p => new PrizeDto
                {
                    PrizeId = p.PrizeId,
                    EventId = p.EventId,
                    EventName = p.Event!.EventName,
                    Title = p.Title,
                    Amount = p.Amount,
                    Track = p.Track,
                    Description = p.Description,
                    Rank = p.Rank
                })
                .ToListAsync();

            return Ok(prizes);
        }

        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPrizeById(Guid id)
        {
            var prize = await _context.Prizes.AsNoTracking()
                .Include(p => p.Event)
                .Where(p => p.PrizeId == id)
                .Select(p => new PrizeDto
                {
                    PrizeId = p.PrizeId,
                    EventId = p.EventId,
                    EventName = p.Event!.EventName,
                    Title = p.Title,
                    Amount = p.Amount,
                    Track = p.Track,
                    Description = p.Description,
                    Rank = p.Rank
                })
                .FirstOrDefaultAsync();

            if (prize == null) return NotFound(new { message = "Prize not found." });
            return Ok(prize);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePrize([FromBody] CreatePrizeRequest request)
        {
            var eventExists = await _context.Events.AnyAsync(e => e.EventId == request.EventId);
            if (!eventExists) return BadRequest(new { message = "Event not found." });

            var prize = new Prize
            {
                EventId = request.EventId,
                Title = request.Title,
                Amount = request.Amount,
                Track = request.Track,
                Description = request.Description,
                Rank = request.Rank
            };

            _context.Prizes.Add(prize);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPrizeById), new { id = prize.PrizeId }, new { id = prize.PrizeId });
        }

        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePrize(Guid id, [FromBody] UpdatePrizeRequest request)
        {
            var prize = await _context.Prizes.FirstOrDefaultAsync(p => p.PrizeId == id);
            if (prize == null) return NotFound(new { message = "Prize not found." });

            prize.Title = request.Title;
            prize.Amount = request.Amount;
            prize.Track = request.Track;
            prize.Description = request.Description;
            prize.Rank = request.Rank;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Prize updated successfully." });
        }

        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePrize(Guid id)
        {
            var prize = await _context.Prizes.FirstOrDefaultAsync(p => p.PrizeId == id);
            if (prize == null) return NotFound(new { message = "Prize not found." });

            _context.Prizes.Remove(prize);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Prize deleted successfully." });
        }
    }
}
