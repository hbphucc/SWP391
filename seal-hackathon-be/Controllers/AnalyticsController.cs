using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin,Judge")]
    public class AnalyticsController : ControllerBase
    {
        private readonly IAnalyticsService _analyticsService;

        public AnalyticsController(IAnalyticsService analyticsService)
        {
            _analyticsService = analyticsService;
        }

        [HttpGet("inter-rater")]
        public async Task<IActionResult> GetInterRater([FromQuery] Guid? eventId)
            => Ok(await _analyticsService.GetInterRaterAsync(eventId));

        /// <summary>
        /// Score spread across judges for a calibration round, so they can see where
        /// they diverge before real judging begins.
        /// </summary>
        [HttpGet("calibration/{roundId:guid}")]
        public async Task<IActionResult> GetCalibrationDistribution(Guid roundId)
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            Guid? userId = Guid.TryParse(raw, out var id) ? id : null;

            var result = await _analyticsService.GetCalibrationDistributionAsync(
                roundId, userId, User.IsInRole("Admin"));

            // Deliberately the same answer for "no such round", "not a calibration
            // round" and "not your round" — the caller learns nothing either way.
            return result == null
                ? NotFound(new { message = "Calibration round not found." })
                : Ok(result);
        }
    }
}
