using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.Models.Enums;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/teams")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminTeamsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLogService;

        public AdminTeamsController(
            ApplicationDbContext context,
            INotificationService notificationService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _notificationService = notificationService;
            _auditLogService = auditLogService;
        }

        private Guid? GetActorUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userId, out var parsed) ? parsed : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetTeams()
        {
            var teams = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                    .ThenInclude(m => m.User)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new
                {
                    t.TeamId,
                    t.TeamName,
                    status = t.Status.ToString(),
                    category = new
                    {
                        t.Category!.CategoryId,
                        t.Category.CategoryName
                    },
                    currentRound = t.CurrentRound == null ? null : new
                    {
                        t.CurrentRound.RoundId,
                        t.CurrentRound.RoundName
                    },
                    members = t.Members.Select(m => new
                    {
                        m.UserId,
                        m.User!.FullName,
                        m.User.Email
                    })
                })
                .ToListAsync();

            return Ok(teams);
        }

        [HttpPut("{teamId}/approve")]
        public async Task<IActionResult> ApproveTeam(Guid teamId)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            if (team.Members.Count < 3 || team.Members.Count > 5)
                return BadRequest(new { message = "Team must have 3 to 5 members before approval." });

            team.Status = TeamStatus.Approved;

            await _context.SaveChangesAsync();
            await _notificationService.CreateForUsersAsync(
                team.Members.Select(m => m.UserId),
                "Team approved",
                $"Team {team.TeamName} has been approved.",
                "team");
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "approve_team",
                "Team",
                team.TeamId.ToString(),
                $"Approved team {team.TeamName}.");

            return Ok(new { message = "Team approved successfully." });
        }

        [HttpPut("{teamId}/reject")]
        public async Task<IActionResult> RejectTeam(Guid teamId)
        {
            var team = await _context.Teams
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            team.Status = TeamStatus.Eliminated;

            await _context.SaveChangesAsync();
            await _notificationService.CreateForUsersAsync(
                team.Members.Select(m => m.UserId),
                "Team rejected",
                $"Team {team.TeamName} was rejected.",
                "team");
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "reject_team",
                "Team",
                team.TeamId.ToString(),
                $"Rejected team {team.TeamName}.");

            return Ok(new { message = "Team rejected successfully." });
        }
        [HttpPut("{teamId}/eliminate")]
        public async Task<IActionResult> EliminateTeam(Guid teamId, [FromBody] EliminateTeamRequest request)
        {
            var team = await _context.Teams
                .Include(t => t.Category)
                .Include(t => t.CurrentRound)
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.TeamId == teamId);

            if (team == null)
                return NotFound(new { message = "Team not found." });

            if (team.Status == TeamStatus.Eliminated)
                return BadRequest(new { message = "Team is already eliminated." });

            team.Status = TeamStatus.Eliminated;
            team.EliminationReason = request.Reason;
            team.EliminatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _notificationService.CreateForUsersAsync(
                team.Members.Select(m => m.UserId),
                "Team eliminated",
                $"Team {team.TeamName} was eliminated. Reason: {request.Reason}",
                "team");
            await _auditLogService.LogAsync(
                GetActorUserId(),
                "eliminate_team",
                "Team",
                team.TeamId.ToString(),
                $"Eliminated team {team.TeamName}. Reason: {request.Reason}");

            return Ok(new
            {
                message = "Team eliminated successfully.",
                team = new
                {
                    team.TeamId,
                    team.TeamName,
                    status = team.Status.ToString(),
                    team.EliminationReason,
                    team.EliminatedAt,
                    category = team.Category == null ? null : new
                    {
                        team.Category.CategoryId,
                        team.Category.CategoryName
                    },
                    currentRound = team.CurrentRound == null ? null : new
                    {
                        team.CurrentRound.RoundId,
                        team.CurrentRound.RoundName
                    }
                }
            });
        }
    }
}
