using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Enums;
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
        private readonly IRoundStaffService _roundStaffService;

        public AdminMentorsController(IMentorAdminService mentorAdminService, IRoundStaffService roundStaffService)
        {
            _mentorAdminService = mentorAdminService;
            _roundStaffService = roundStaffService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return userId == null ? null : Guid.Parse(userId);
        }

        [HttpGet("assignments")]
        public async Task<IActionResult> GetAssignments([FromQuery] Guid? eventId)
            => this.ToActionResult(await _mentorAdminService.GetAssignmentsAsync(eventId));

        /// <summary>Step one of allocation: puts a mentor on a round.</summary>
        [HttpPost("assignments/round")]
        public async Task<IActionResult> AssignMentorToRound([FromBody] AssignMentorToRoundRequest request)
            => this.ToActionResult(await _roundStaffService.AssignAsync(
                TryGetCurrentUserId(), request.MentorUserId, request.RoundId, RoundStaffRole.Mentor));

        /// <summary>Step two: points a mentor already on the round at one of its teams.</summary>
        [HttpPost("assignments")]
        public async Task<IActionResult> AssignMentor([FromBody] AssignMentorRequest request)
            => this.ToActionResult(await _mentorAdminService.AssignMentorAsync(TryGetCurrentUserId(), request.MentorUserId, request.RoundId, request.TeamId));

        /// <summary>Track-level allocation, as described in the brief.</summary>
        [HttpPost("assignments/category")]
        public async Task<IActionResult> AssignMentorToCategory([FromBody] AssignMentorToCategoryRequest request)
            => this.ToActionResult(await _mentorAdminService.AssignMentorToCategoryAsync(TryGetCurrentUserId(), request.MentorUserId, request.RoundId, request.CategoryId));

        [HttpDelete("assignments/{id}")]
        public async Task<IActionResult> DeactivateAssignment(Guid id)
            => this.ToActionResult(await _mentorAdminService.DeactivateAssignmentAsync(id));
    }
}
