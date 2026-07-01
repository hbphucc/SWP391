using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

        [HttpGet("assignments")]
        public async Task<IActionResult> GetAssignments()
            => this.ToActionResult(await _mentorAdminService.GetAssignmentsAsync());

        [HttpDelete("assignments/{id}")]
        public async Task<IActionResult> DeactivateAssignment(Guid id)
            => this.ToActionResult(await _mentorAdminService.DeactivateAssignmentAsync(id));
    }
}
