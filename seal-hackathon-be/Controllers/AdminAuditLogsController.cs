using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;

namespace SEAL.NET.Controllers
{
    [Route("api/admin/audit-logs")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminAuditLogsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminAuditLogsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .Include(log => log.ActorUser)
                .OrderByDescending(log => log.CreatedAt)
                .Take(200)
                .Select(log => new
                {
                    log.Id,
                    log.ActorUserId,
                    actorName = log.ActorUser == null ? null : log.ActorUser.FullName,
                    actorEmail = log.ActorUser == null ? null : log.ActorUser.Email,
                    log.Action,
                    log.EntityType,
                    log.EntityId,
                    log.Description,
                    log.CreatedAt
                })
                .ToListAsync();

            return Ok(logs);
        }
    }
}
