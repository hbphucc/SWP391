using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Criteria;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Controllers
{
    [Route("api/rounds/{roundId}/criteria")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class CriteriaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CriteriaController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetCriteria(Guid roundId)
        {
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == roundId);
            if (!roundExists)
                return NotFound(new { message = "Round not found." });

            var criteria = await _context.Criteria
                .Where(c => c.RoundId == roundId)
                .Select(c => new
                {
                    c.CriteriaId,
                    c.CriteriaName,
                    c.MaxScore,
                    c.Weight,
                    c.RoundId
                })
                .ToListAsync();

            return Ok(criteria);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCriteria(Guid roundId, [FromBody] CreateCriteriaRequest request)
        {
            var roundExists = await _context.Rounds.AnyAsync(r => r.RoundId == roundId);
            if (!roundExists)
                return NotFound(new { message = "Round not found." });

            var currentTotalWeight = await _context.Criteria
                .Where(c => c.RoundId == roundId)
                .SumAsync(c => c.Weight);

            if (currentTotalWeight + request.Weight > 100)
                return BadRequest(new { message = "Total criteria weight cannot exceed 100." });

            var duplicate = await _context.Criteria.AnyAsync(c =>
                c.RoundId == roundId &&
                c.CriteriaName.ToLower() == request.CriteriaName.ToLower());

            if (duplicate)
                return BadRequest(new { message = "Criteria name already exists in this round." });

            var criteria = new Criteria
            {
                RoundId = roundId,
                CriteriaName = request.CriteriaName,
                MaxScore = request.MaxScore,
                Weight = request.Weight
            };

            _context.Criteria.Add(criteria);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Criteria created successfully.",
                criteria.CriteriaId
            });
        }

        [HttpPut("{criteriaId}")]
        public async Task<IActionResult> UpdateCriteria(Guid roundId, Guid criteriaId, [FromBody] UpdateCriteriaRequest request)
        {
            var criteria = await _context.Criteria
                .FirstOrDefaultAsync(c => c.RoundId == roundId && c.CriteriaId == criteriaId);

            if (criteria == null)
                return NotFound(new { message = "Criteria not found." });

            var otherWeights = await _context.Criteria
                .Where(c => c.RoundId == roundId && c.CriteriaId != criteriaId)
                .SumAsync(c => c.Weight);

            if (otherWeights + request.Weight > 100)
                return BadRequest(new { message = "Total criteria weight cannot exceed 100." });

            criteria.CriteriaName = request.CriteriaName;
            criteria.MaxScore = request.MaxScore;
            criteria.Weight = request.Weight;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Criteria updated successfully." });
        }

        [HttpDelete("{criteriaId}")]
        public async Task<IActionResult> DeleteCriteria(Guid roundId, Guid criteriaId)
        {
            var criteria = await _context.Criteria
                .Include(c => c.Scores)
                .FirstOrDefaultAsync(c => c.RoundId == roundId && c.CriteriaId == criteriaId);

            if (criteria == null)
                return NotFound(new { message = "Criteria not found." });

            if (criteria.Scores.Any())
                return BadRequest(new { message = "Cannot delete criteria because it already has scores." });

            _context.Criteria.Remove(criteria);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Criteria deleted successfully." });
        }
    }
}