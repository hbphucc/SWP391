using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/teams")]
    [ApiController]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamService _teamService;

        public TeamsController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        private bool IsPrivileged() =>
            User.IsInRole("Admin") || User.IsInRole("Judge") || User.IsInRole("Mentor");

        private IActionResult ToActionResult(ServiceResult result) => result.Outcome switch
        {
            ServiceOutcome.Ok => Ok(result.Body),
            ServiceOutcome.BadRequest => BadRequest(result.Body),
            ServiceOutcome.NotFound => NotFound(result.Body),
            ServiceOutcome.Forbidden => Forbid(),
            ServiceOutcome.Conflict => Conflict(result.Body),
            _ => StatusCode(500)
        };

        [HttpPost]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request)
            => ToActionResult(await _teamService.CreateTeamAsync(GetCurrentUserId(), request));

        [HttpGet("my-team")]
        public async Task<IActionResult> GetMyTeam()
        {
            var result = await _teamService.GetMyTeamAsync(GetCurrentUserId());
            if (result.Outcome == ServiceOutcome.NotFound)
            {
                return NoContent();
            }
            return ToActionResult(result);
        }

        [HttpGet("mentoring")]
        [Authorize(Roles = "Mentor")]
        public async Task<IActionResult> GetMentoringTeams()
            => ToActionResult(await _teamService.GetMentoringTeamsAsync(GetCurrentUserId()));

        [HttpGet("judging")]
        [Authorize(Roles = "Judge")]
        public async Task<IActionResult> GetJudgingTeams()
            => ToActionResult(await _teamService.GetJudgingTeamsAsync(GetCurrentUserId()));

        [HttpPost("my-team/members")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AddMemberToMyTeam([FromBody] AddTeamMemberByStudentCodeRequest request)
            => ToActionResult(await _teamService.AddMemberToMyTeamAsync(GetCurrentUserId(), request));

        [HttpDelete("my-team/members/{studentCode}")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMemberFromMyTeam(string studentCode)
            => ToActionResult(await _teamService.RemoveMemberFromMyTeamAsync(GetCurrentUserId(), studentCode));

        [HttpPost("my-team/members/{userId}/kick-request")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> CreateKickRequest(Guid userId, [FromBody] CreateKickRequestRequest request)
            => ToActionResult(await _teamService.CreateKickRequestAsync(GetCurrentUserId(), userId, request));

        [HttpPost("leave")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> LeaveTeam()
            => ToActionResult(await _teamService.LeaveTeamAsync(GetCurrentUserId()));

        [HttpPut("my-team")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> UpdateMyTeam([FromBody] UpdateMyTeamRequest request)
            => ToActionResult(await _teamService.UpdateMyTeamAsync(GetCurrentUserId(), request));

        [HttpPut("transfer-leader")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> TransferLeader([FromBody] TransferLeaderRequest request)
            => ToActionResult(await _teamService.TransferLeaderAsync(GetCurrentUserId(), request));

        [HttpPost("{teamId}/members")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> AddMember(Guid teamId, [FromBody] AddTeamMemberRequest request)
            => ToActionResult(await _teamService.AddMemberAsync(GetCurrentUserId(), teamId, request));

        [HttpDelete("{teamId}/members/{userId}")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RemoveMember(Guid teamId, Guid userId)
            => ToActionResult(await _teamService.RemoveMemberAsync(GetCurrentUserId(), teamId, userId));

        // The mentor roster used to live here to feed a team leader's mentor picker,
        // open to any signed-in user. Allocation is an organiser's job now, and the
        // admin screen reads /api/admin/events/{id}/registered-mentors instead, so
        // this only stood to hand every student a list of mentor email addresses.

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTeamById(Guid id)
            => ToActionResult(await _teamService.GetTeamByIdAsync(GetCurrentUserId(), id, IsPrivileged()));

        // The team-picks-its-own-mentor endpoints lived here. Allocation moved to
        // POST /api/admin/mentors/assignments/round and .../assignments, which an
        // organiser drives per round.

        [HttpGet("recruiting")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> GetRecruitingTeams()
            => ToActionResult(await _teamService.GetRecruitingTeamsAsync(GetCurrentUserId()));

        [HttpPost("{teamId}/join-request")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> RequestToJoinTeam(Guid teamId)
            => ToActionResult(await _teamService.RequestToJoinTeamAsync(GetCurrentUserId(), teamId));

        [HttpGet("members/search")]
        [Authorize(Roles = "Member,TeamLeader")]
        public async Task<IActionResult> SearchMembers([FromQuery] string query, [FromQuery] Guid categoryId)
            => ToActionResult(await _teamService.SearchMemberEmailsAsync(GetCurrentUserId(), query, categoryId));
    }
}
