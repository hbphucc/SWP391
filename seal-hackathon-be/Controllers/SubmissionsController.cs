using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Submission;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/submissions")]
    [ApiController]
    [Authorize]
    public class SubmissionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SubmissionsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpPost]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> SubmitProject([FromBody] CreateSubmissionRequest request)
        {
            var currentUserId = GetCurrentUserId();

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == request.TeamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            if (team.LeaderId != currentUserId)
                return Forbid();

            if (team.Status != TeamStatus.Approved)
                return BadRequest(new { message = "Only approved teams can submit." });

            if (team.CurrentRoundId != request.RoundId)
                return BadRequest(new { message = "Team can only submit for its current round." });

            var round = await _context.Rounds.FindAsync(request.RoundId);
            if (round == null)
                return NotFound(new { message = "Round not found." });

            if (DateTime.UtcNow > round.SubmissionDeadline)
                return BadRequest(new { message = "Submission deadline has passed." });

            var existingSubmission = await _context.Submissions
                .FirstOrDefaultAsync(s => s.TeamId == request.TeamId && s.RoundId == request.RoundId);

            if (existingSubmission != null)
            {
                existingSubmission.RepositoryUrl = request.RepositoryUrl;
                existingSubmission.DemoUrl = request.DemoUrl;
                existingSubmission.SlideUrl = request.SlideUrl;
                existingSubmission.SubmittedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Submission updated successfully.",
                    existingSubmission.SubmissionId
                });
            }

            var submission = new Submission
            {
                TeamId = request.TeamId,
                RoundId = request.RoundId,
                RepositoryUrl = request.RepositoryUrl,
                DemoUrl = request.DemoUrl,
                SlideUrl = request.SlideUrl
            };

            _context.Submissions.Add(submission);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Submission created successfully.",
                submission.SubmissionId
            });
        }

        [HttpGet("team/{teamId}")]
        public async Task<IActionResult> GetTeamSubmissions(Guid teamId)
        {
            var currentUserId = GetCurrentUserId();

            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            var isMember = team.Members.Any(m => m.UserId == currentUserId);
            var isAdminOrJudge = User.IsInRole("Admin") || User.IsInRole("Judge");

            if (!isMember && !isAdminOrJudge)
                return Forbid();

            var submissions = await _context.Submissions
                .Include(s => s.Round)
                .Where(s => s.TeamId == teamId)
                .OrderByDescending(s => s.SubmittedAt)
                .Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    round = new
                    {
                        s.Round!.RoundId,
                        s.Round.RoundName
                    }
                })
                .ToListAsync();

            return Ok(submissions);
        }

        [HttpGet("round/{roundId}")]
        [Authorize(Roles = "Admin,Judge")]
        public async Task<IActionResult> GetRoundSubmissions(Guid roundId)
        {
            var submissions = await _context.Submissions
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Where(s => s.RoundId == roundId)
                .Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    team = new
                    {
                        s.Team!.TeamId,
                        s.Team.TeamName,
                        category = s.Team.Category!.CategoryName
                    }
                })
                .ToListAsync();

            return Ok(submissions);
        }

        [HttpGet("scoring-queue")]
        [Authorize(Roles = "Admin,Judge")]
        public async Task<IActionResult> GetScoringQueue()
        {
            var userId = GetCurrentUserId();
            var isAdmin = User.IsInRole("Admin");

            IQueryable<Submission> query = _context.Submissions;

            if (!isAdmin)
            {
                var assignments = await _context.JudgeAssignments
                    .Where(a => a.JudgeId == userId)
                    .ToListAsync();

                var roundIds = assignments.Select(a => a.RoundId).ToList();
                var categoryIds = assignments.Select(a => a.CategoryId).ToList();

                query = query.Where(s =>
                    roundIds.Contains(s.RoundId) &&
                    categoryIds.Contains(s.Team!.CategoryId));
            }

            var submissions = await query
                .Include(s => s.Team)
                    .ThenInclude(t => t.Category)
                .Include(s => s.Round)
                .ToListAsync();

            var submissionIds = submissions.Select(s => s.SubmissionId).ToList();

            var userScores = await _context.Scores
                .Where(s => submissionIds.Contains(s.SubmissionId) && s.JudgeId == userId)
                .ToListAsync();

            var result = submissions.Select(s =>
            {
                var scoresForSub = userScores.Where(sc => sc.SubmissionId == s.SubmissionId).ToList();
                var status = "pending";
                if (scoresForSub.Any())
                {
                    status = scoresForSub.All(sc => sc.IsLocked) ? "locked" : "scored";
                }

                return new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    status,
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
                };
            }).ToList();

            return Ok(result);
        }
    }
}