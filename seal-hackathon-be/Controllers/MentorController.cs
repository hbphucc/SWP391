using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SEAL.NET.Controllers
{
    [Route("api/mentor")]
    [ApiController]
    [Authorize(Roles = "Mentor")]
    public class MentorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public MentorController(ApplicationDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.Parse(userId!);
        }

        [HttpGet("teams")]
        public async Task<IActionResult> GetAssignedTeams()
        {
            var currentUserId = GetCurrentUserId();

            var assignments = await _context.MentorAssignments
                .Include(ma => ma.Team)
                    .ThenInclude(t => t.Category)
                        .ThenInclude(c => c.Event)
                .Include(ma => ma.Team)
                    .ThenInclude(t => t.Members)
                .Include(ma => ma.Team)
                    .ThenInclude(t => t.Submissions)
                        .ThenInclude(s => s.Round)
                .Where(ma => ma.MentorUserId == currentUserId && ma.IsActive)
                .ToListAsync();

            var result = assignments.Select(ma =>
            {
                var team = ma.Team;
                var latestSub = team.Submissions
                    .OrderByDescending(s => s.SubmittedAt)
                    .FirstOrDefault();

                return new MentorTeamResponseDto
                {
                    TeamId = team.TeamId,
                    TeamName = team.TeamName,
                    CategoryName = team.Category.CategoryName,
                    EventName = team.Category.Event?.EventName ?? string.Empty,
                    Status = team.Status.ToString(),
                    MembersCount = team.Members.Count,
                    Notes = ma.Notes,
                    LatestSubmission = latestSub == null ? null : new MentorTeamSubmissionDto
                    {
                        SubmissionId = latestSub.SubmissionId,
                        RepositoryUrl = latestSub.RepositoryUrl,
                        DemoUrl = latestSub.DemoUrl,
                        SlideUrl = latestSub.SlideUrl,
                        SubmittedAt = latestSub.SubmittedAt,
                        RoundName = latestSub.Round?.RoundName ?? "General"
                    }
                };
            }).ToList();

            return Ok(result);
        }

        [HttpGet("teams/{teamId}")]
        public async Task<IActionResult> GetAssignedTeamDetail(Guid teamId)
        {
            var currentUserId = GetCurrentUserId();

            var assignment = await _context.MentorAssignments
                .FirstOrDefaultAsync(ma => ma.MentorUserId == currentUserId && ma.TeamId == teamId && ma.IsActive);

            if (assignment == null)
                return Forbid();

            var team = await _context.Teams
                .Include(t => t.Category)
                    .ThenInclude(c => c.Event)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .Include(t => t.Submissions)
                    .ThenInclude(s => s.Round)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            return Ok(new
            {
                team.TeamId,
                team.TeamName,
                status = team.Status.ToString(),
                category = new
                {
                    team.Category!.CategoryId,
                    team.Category.CategoryName,
                    eventId = team.Category.EventId,
                    eventName = team.Category.Event?.EventName
                },
                currentRound = team.CurrentRound == null ? null : new
                {
                    team.CurrentRound.RoundId,
                    team.CurrentRound.RoundName
                },
                notes = assignment.Notes,
                members = team.Members.Select(m => new
                {
                    id = m.UserId,
                    name = m.User!.FullName,
                    email = m.User.Email,
                    role = m.Role,
                    studentCode = m.User.StudentCode,
                    schoolName = m.User.SchoolName
                }),
                submissions = team.Submissions.Select(s => new
                {
                    s.SubmissionId,
                    s.RepositoryUrl,
                    s.DemoUrl,
                    s.SlideUrl,
                    s.SubmittedAt,
                    roundName = s.Round?.RoundName ?? "General"
                })
            });
        }

        [HttpPost("teams/{teamId}/notes")]
        public async Task<IActionResult> SaveTeamNotes(Guid teamId, [FromBody] SaveNotesRequest request)
        {
            var currentUserId = GetCurrentUserId();

            var assignment = await _context.MentorAssignments
                .FirstOrDefaultAsync(ma => ma.MentorUserId == currentUserId && ma.TeamId == teamId && ma.IsActive);

            if (assignment == null)
                return Forbid();

            assignment.Notes = request.Notes;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notes saved successfully." });
        }
    }
}
