using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/mentors")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminMentorsController : ControllerBase
    {
        private readonly IMentorAdminService _mentorAdminService;

        public AdminMentorsController(IMentorAdminService mentorAdminService)
        {
            _mentorAdminService = mentorAdminService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId == null ? null : Guid.Parse(userId);
        }

        [HttpGet("assignments")]
        public async Task<IActionResult> GetAssignments([FromQuery] Guid? eventId)
            => this.ToActionResult(await _mentorAdminService.GetAssignmentsAsync(eventId));

        [HttpPost("assignments")]
        public async Task<IActionResult> AssignMentor([FromBody] AssignMentorRequest request)
            => this.ToActionResult(await _mentorAdminService.AssignMentorAsync(TryGetCurrentUserId(), request.MentorUserId, request.TeamId));

        [HttpDelete("assignments/{id}")]
        public async Task<IActionResult> DeactivateAssignment(Guid id)
            => this.ToActionResult(await _mentorAdminService.DeactivateAssignmentAsync(id));
    }
}
