using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Judge;
using SEAL.NET.Models.Entities;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/judge-assignments")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class JudgeAssignmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public JudgeAssignmentsController(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAssignments()
        {
            var assignments = await _context.JudgeAssignments
                .Include(a => a.Judge)
                .Include(a => a.Round)
                .Include(a => a.Category)
                .Select(a => new
                {
                    a.AssignmentId,
                    judge = new
                    {
                        a.JudgeId,
                        a.Judge!.FullName,
                        a.Judge.Email
                    },
                    round = new
                    {
                        a.RoundId,
                        a.Round!.RoundName
                    },
                    category = new
                    {
                        a.CategoryId,
                        a.Category!.CategoryName
                    }
                })
                .ToListAsync();

            return Ok(assignments);
        }

        [HttpPost]
        public async Task<IActionResult> CreateAssignment([FromBody] CreateJudgeAssignmentRequest request)
        {
            var judge = await _userManager.FindByIdAsync(request.JudgeId.ToString());
            if (judge == null)
                return NotFound(new { message = "Judge not found." });

            var isJudge = await _userManager.IsInRoleAsync(judge, "Judge");
            if (!isJudge)
                return BadRequest(new { message = "This user is not a Judge." });

            var round = await _context.Rounds.FindAsync(request.RoundId);
            if (round == null)
                return NotFound(new { message = "Round not found." });

            var category = await _context.Categories.FindAsync(request.CategoryId);
            if (category == null)
                return NotFound(new { message = "Category not found." });

            if (round.EventId != category.EventId)
                return BadRequest(new { message = "Round and category must belong to the same event." });

            var duplicate = await _context.JudgeAssignments.AnyAsync(a =>
                a.JudgeId == request.JudgeId &&
                a.RoundId == request.RoundId &&
                a.CategoryId == request.CategoryId);

            if (duplicate)
                return BadRequest(new { message = "Judge assignment already exists." });

            var assignment = new JudgeAssignment
            {
                JudgeId = request.JudgeId,
                RoundId = request.RoundId,
                CategoryId = request.CategoryId
            };

            _context.JudgeAssignments.Add(assignment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Judge assigned successfully.",
                assignment.AssignmentId
            });
        }

        [HttpDelete("{assignmentId}")]
        public async Task<IActionResult> DeleteAssignment(Guid assignmentId)
        {
            var assignment = await _context.JudgeAssignments.FindAsync(assignmentId);

            if (assignment == null)
                return NotFound(new { message = "Assignment not found." });

            _context.JudgeAssignments.Remove(assignment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Judge assignment removed successfully." });
        }
    }
}