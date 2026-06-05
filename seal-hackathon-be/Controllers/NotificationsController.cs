using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Notification;
using SEAL.NET.Models.Entities;
using System.Security.Claims;

namespace SEAL.NET.Controllers
{
    [Route("api/notifications")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public NotificationsController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        private Guid? TryGetCurrentUserId()
        {
            var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(raw, out var id) ? id : null;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = TryGetCurrentUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid authentication token." });

            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId!.Value)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new
                {
                    n.Id,
                    n.Title,
                    n.Message,
                    n.Type,
                    n.IsRead,
                    n.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpPost("{id}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = TryGetCurrentUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid authentication token." });
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId!.Value);

            if (notification == null)
                return NotFound(new { message = "Notification not found." });

            notification.IsRead = true;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Notification marked as read." });
        }

        [HttpPost("read-all")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = TryGetCurrentUserId();
            if (userId == null) return Unauthorized(new { message = "Invalid authentication token." });
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId!.Value && !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "All notifications marked as read." });
        }

        [HttpPost("broadcast")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BroadcastNotification([FromBody] BroadcastNotificationRequest request)
        {
            var allUsers = await _userManager.Users.ToListAsync();

            if (allUsers.Count == 0)
                return BadRequest(new { message = "No users found to broadcast to." });

            var broadcastId = Guid.NewGuid();
            var now = DateTime.UtcNow;

            var notifications = allUsers.Select(u => new Models.Entities.Notification
            {
                UserId = u.Id,
                Title = request.Title,
                Message = request.Message,
                Type = request.Type,
                BroadcastId = broadcastId,
                IsBroadcast = true,
                CreatedAt = now
            }).ToList();

            _context.Notifications.AddRange(notifications);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Broadcast notification sent successfully.",
                broadcastId,
                recipientCount = notifications.Count
            });
        }

        [HttpGet("broadcast-history")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetBroadcastHistory()
        {
            var history = await _context.Notifications
                .Where(n => n.IsBroadcast && n.BroadcastId != null)
                .GroupBy(n => n.BroadcastId)
                .Select(g => new BroadcastNotificationHistoryDto
                {
                    BroadcastId = g.Key!.Value,
                    Title = g.First().Title,
                    Message = g.First().Message,
                    Type = g.First().Type,
                    CreatedAt = g.First().CreatedAt,
                    RecipientCount = g.Count()
                })
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();

            return Ok(history);
        }
    }
}
