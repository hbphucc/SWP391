using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    /// <summary>
    /// Judge-facing dashboard + assigned-teams aggregation. Every endpoint is
    /// scoped server-side to the authenticated judge's own assignments.
    /// </summary>
    [Route("api/judge")]
    [ApiController]
    [Authorize(Roles = "Judge")]
    public class JudgeDashboardController : ControllerBase
    {
        private readonly IJudgeDashboardService _service;

        public JudgeDashboardController(IJudgeDashboardService service)
        {
            _service = service;
        }

        private Guid GetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : Guid.Empty;
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
            => this.ToActionResult(await _service.GetDashboardAsync(GetCurrentUserId()));

        [HttpGet("teams")]
        public async Task<IActionResult> GetAssignedTeams(
            [FromQuery] Guid? eventId,
            [FromQuery] Guid? roundId,
            [FromQuery] string? status,
            [FromQuery] string? search)
            => this.ToActionResult(await _service.GetAssignedTeamsAsync(
                GetCurrentUserId(), eventId, roundId, status, search));
    }
}
