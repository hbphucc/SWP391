using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.DTOs.Track;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Controllers
{
    /// <summary>
    /// Global competition-track catalog. Reads are open (forms/filters need them);
    /// mutations are Admin-only, mirroring <see cref="CategoriesController"/>.
    /// </summary>
    [Route("api/tracks")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class TracksController : ControllerBase
    {
        private readonly ITrackService _trackService;

        public TracksController(ITrackService trackService)
        {
            _trackService = trackService;
        }

        /// <summary>
        /// Lists tracks. Defaults to active-only (for pickers); pass
        /// <c>activeOnly=false</c> to include retired tracks in admin management.
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetTracks([FromQuery] bool activeOnly = true, [FromQuery] string? search = null)
            => this.ToActionResult(await _trackService.GetTracksAsync(activeOnly, search));

        [HttpGet("{trackId:guid}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrackById(Guid trackId)
            => this.ToActionResult(await _trackService.GetTrackByIdAsync(trackId));

        [HttpPost]
        public async Task<IActionResult> CreateTrack([FromBody] CreateTrackRequest request)
            => this.ToActionResult(await _trackService.CreateTrackAsync(request));

        [HttpPut("{trackId:guid}")]
        public async Task<IActionResult> UpdateTrack(Guid trackId, [FromBody] UpdateTrackRequest request)
            => this.ToActionResult(await _trackService.UpdateTrackAsync(trackId, request));

        [HttpDelete("{trackId:guid}")]
        public async Task<IActionResult> DeleteTrack(Guid trackId)
            => this.ToActionResult(await _trackService.DeleteTrackAsync(trackId));
    }
}
