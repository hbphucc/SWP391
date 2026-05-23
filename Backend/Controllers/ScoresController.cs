using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Score;
using SEAL.NET.Models.Entities;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/judge/scores")]
    [ApiController]
    [Authorize(Roles = "Judge")]
    public class ScoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ScoresController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpPost]
        public async Task<IActionResult> SubmitScore([FromBody] CreateScoreRequest request)
        {
            var judgeId = GetCurrentUserId();

            var submission = await _context.Submissions
                .Include(s => s.Team)
                .Include(s => s.Round)
                .FirstOrDefaultAsync(s => s.SubmissionId == request.SubmissionId);

            if (submission == null)
                return NotFound(new { message = "Submission not found." });

            var criteria = await _context.Criteria
                .FirstOrDefaultAsync(c =>
                    c.CriteriaId == request.CriteriaId &&
                    c.RoundId == submission.RoundId);

            if (criteria == null)
                return BadRequest(new { message = "Criteria does not belong to this submission round." });

            if (request.ScoreValue < 0 || request.ScoreValue > criteria.MaxScore)
                return BadRequest(new { message = $"Score must be between 0 and {criteria.MaxScore}." });

            var isAssigned = await _context.JudgeAssignments.AnyAsync(a =>
                a.JudgeId == judgeId &&
                a.RoundId == submission.RoundId &&
                a.CategoryId == submission.Team!.CategoryId);

            if (!isAssigned)
                return Forbid();

            var existingScore = await _context.Scores.FirstOrDefaultAsync(s =>
                s.SubmissionId == request.SubmissionId &&
                s.JudgeId == judgeId &&
                s.CriteriaId == request.CriteriaId);

            if (existingScore != null)
            {
                existingScore.ScoreValue = request.ScoreValue;
                existingScore.Comment = request.Comment;
                existingScore.CreatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Score updated successfully." });
            }

            var score = new Score
            {
                SubmissionId = request.SubmissionId,
                JudgeId = judgeId,
                CriteriaId = request.CriteriaId,
                ScoreValue = request.ScoreValue,
                Comment = request.Comment
            };

            _context.Scores.Add(score);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Score submitted successfully.", score.ScoreId });
        }

        [HttpGet("my-assigned-submissions")]
        public async Task<IActionResult> GetMyAssignedSubmissions()
        {
            var judgeId = GetCurrentUserId();

            var assignments = await _context.JudgeAssignments
                .Where(a => a.JudgeId == judgeId)
                .ToListAsync();

            var roundIds = assignments.Select(a => a.RoundId).ToList();
            var categoryIds = assignments.Select(a => a.CategoryId).ToList();

            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .Where(s =>
                    roundIds.Contains(s.RoundId) &&
                    categoryIds.Contains(s.Team!.CategoryId))
                .Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    team = new
                    {
                        s.Team!.TeamId,
                        s.Team.TeamName,
                        category = s.Team.Category!.CategoryName
                    },
                    round = new
                    {
                        s.Round!.RoundId,
                        s.Round.RoundName
                    }
                })
                .ToListAsync();

            return Ok(submissions);
        }
    }
}