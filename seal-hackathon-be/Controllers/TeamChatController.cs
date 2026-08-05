using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/teams/{teamId:guid}/chat")]
    [ApiController]
    [Authorize]
    public class TeamChatController : ControllerBase
    {
        private readonly ITeamChatService _teamChatService;

        public TeamChatController(ITeamChatService teamChatService)
        {
            _teamChatService = teamChatService;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        private IList<string> GetUserRoles()
            => User.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value).ToList();

        [HttpGet]
        public async Task<IActionResult> GetMessages(Guid teamId)
        {
            return this.ToActionResult(await _teamChatService.GetMessagesAsync(teamId, TryGetCurrentUserId(), GetUserRoles()));
        }

        [HttpPost]
        [RequestSizeLimit(10 * 1024 * 1024)] // 10 MB limit matching DocumentService
        public async Task<IActionResult> SendMessage(Guid teamId, [FromForm] string? message, IFormFile? file)
        {
            return this.ToActionResult(await _teamChatService.SendMessageAsync(teamId, TryGetCurrentUserId(), GetUserRoles(), message, file));
        }
    }
}
