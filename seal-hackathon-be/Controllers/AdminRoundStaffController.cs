using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.RoundStaff;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/round-staff")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminRoundStaffController : ControllerBase
    {
        private readonly IRoundStaffService _roundStaffService;

        public AdminRoundStaffController(IRoundStaffService roundStaffService)
        {
            _roundStaffService = roundStaffService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAssignments([FromQuery] Guid eventId)
            => this.ToActionResult(await _roundStaffService.GetAssignmentsAsync(eventId));

        [HttpPost]
        public async Task<IActionResult> Assign([FromBody] AssignRoundStaffRequest request)
        {
            var actorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return this.ToActionResult(await _roundStaffService.AssignAsync(
                actorId == null ? null : Guid.Parse(actorId), request.UserId, request.RoundId, request.Role));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Deactivate(Guid id)
            => this.ToActionResult(await _roundStaffService.DeactivateAsync(id));
    }
}
