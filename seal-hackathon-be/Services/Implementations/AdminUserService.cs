using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.User;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class AdminUserService : IAdminUserService
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly INotificationService _notificationService;
        private readonly IAuditLogService _auditLogService;
        private readonly ApplicationDbContext _db;

        private static readonly string[] AllowedRoles =
        {
            "Admin",
            "Member",
            "TeamLeader",
            "Judge",
            "Mentor"
        };

        public AdminUserService(
            UserManager<ApplicationUser> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            INotificationService notificationService,
            IAuditLogService auditLogService,
            ApplicationDbContext db)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _notificationService = notificationService;
            _auditLogService = auditLogService;
            _db = db;
        }

        // Batch-fetches role names for a list of users in a SINGLE join query, avoiding
        // the N+1 pattern of calling UserManager.GetRolesAsync per user (each call is a
        // round-trip; with ~100ms DB latency that hit the FE's 20s timeout at ~200 users).
        private async Task<Dictionary<Guid, List<string>>> GetRoleMapAsync(IEnumerable<Guid> userIds)
        {
            var ids = userIds.ToList();
            if (ids.Count == 0) return new Dictionary<Guid, List<string>>();

            var pairs = await (
                from ur in _db.Set<IdentityUserRole<Guid>>()
                join r in _db.Roles on ur.RoleId equals r.Id
                where ids.Contains(ur.UserId)
                select new { ur.UserId, r.Name }
            ).ToListAsync();

            return pairs
                .GroupBy(p => p.UserId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Name!).ToList());
        }

        // Callers page through results instead of loading the whole Users table;
        // MaxPageSize mirrors the 200-row cap used for audit logs.
        private const int MaxPageSize = 200;

        private static (int Page, int PageSize) NormalizePaging(int page, int pageSize)
            => (Math.Max(page, 1), Math.Clamp(pageSize, 1, MaxPageSize));

        public async Task<ServiceResult> GetUsersAsync(int page, int pageSize)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);

            var users = await _userManager.Users
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var roleMap = await GetRoleMapAsync(users.Select(u => u.Id));

            var result = users.Select(user => (object)new
            {
                user.Id,
                user.FullName,
                user.Email,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                user.StudentCode,
                user.SchoolName,
                user.IsApproved,
                user.CreatedAt,
                judgeType = user.JudgeType.ToString(),
                roles = roleMap.TryGetValue(user.Id, out var r) ? r : new List<string>()
            }).ToList();

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> GetPendingUsersAsync(int page, int pageSize)
        {
            (page, pageSize) = NormalizePaging(page, pageSize);

            var users = await _userManager.Users
                .Where(u => !u.IsApproved)
                .OrderByDescending(u => u.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var roleMap = await GetRoleMapAsync(users.Select(u => u.Id));

            var result = users.Select(user => (object)new
            {
                user.Id,
                user.FullName,
                user.Email,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                user.StudentCode,
                user.SchoolName,
                user.CreatedAt,
                roles = roleMap.TryGetValue(user.Id, out var r) ? r : new List<string>()
            }).ToList();

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> ApproveUserAsync(Guid? actorUserId, Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            user.IsApproved = true;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            await _notificationService.CreateAsync(
                user.Id,
                "Account approved",
                "Your SEAL account has been approved. You can now sign in.",
                "account");
            await _auditLogService.LogAsync(
                actorUserId,
                "approve_user",
                "User",
                user.Id.ToString(),
                $"Approved user {user.Email}.");

            return ServiceResult.OkMessage("User approved successfully.");
        }

        public async Task<ServiceResult> RejectUserAsync(Guid? actorUserId, Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            user.IsApproved = false;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            // Invalidate the user's existing JWTs so the rejection takes effect immediately.
            await _userManager.UpdateSecurityStampAsync(user);

            await _notificationService.CreateAsync(
                user.Id,
                "Account rejected",
                "Your SEAL account approval was rejected.",
                "account");
            await _auditLogService.LogAsync(
                actorUserId,
                "reject_user",
                "User",
                user.Id.ToString(),
                $"Rejected user {user.Email}.");

            return ServiceResult.OkMessage("User rejected successfully.");
        }

        /// <summary>
        /// Corrects a judge's Internal/Guest label. The two role-granting paths set
        /// this automatically, but judges that predate the field — and the occasional
        /// exception, such as an outside lecturer promoted through the request flow —
        /// need an explicit override.
        /// </summary>
        public async Task<ServiceResult> UpdateJudgeTypeAsync(Guid? actorUserId, Guid userId, UpdateJudgeTypeRequest request)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.NotFound("User not found.");

            if (!await _userManager.IsInRoleAsync(user, "Judge"))
                return ServiceResult.BadRequest("Judge type only applies to users holding the Judge role.");

            var previous = user.JudgeType;
            user.JudgeType = request.JudgeType;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            await _auditLogService.LogAsync(
                actorUserId,
                "update_judge_type",
                "User",
                user.Id.ToString(),
                $"Changed judge type for {user.Email} from {previous} to {request.JudgeType}.");

            return ServiceResult.OkMessage("Judge type updated successfully.");
        }

        public async Task<ServiceResult> UpdateUserRoleAsync(Guid? actorUserId, Guid userId, UpdateUserRoleRequest request)
        {
            if (!AllowedRoles.Contains(request.Role))
                return ServiceResult.BadRequest("Invalid role.");

            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            if (!await _roleManager.RoleExistsAsync(request.Role))
                await _roleManager.CreateAsync(new IdentityRole<Guid>(request.Role));

            var currentRoles = await _userManager.GetRolesAsync(user);
            if ((request.Role == "Mentor" || request.Role == "Judge") && currentRoles.Any())
            {
                var participantRoles = currentRoles.Where(role => role is "Member" or "TeamLeader").ToList();
                if (participantRoles.Any())
                {
                    var removeResult = await _userManager.RemoveFromRolesAsync(user, participantRoles);
                    if (!removeResult.Succeeded)
                        return ServiceResult.BadRequestBody(removeResult.Errors);
                }
            }
            else if (currentRoles.Any())
            {
                var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
                if (!removeResult.Succeeded)
                    return ServiceResult.BadRequestBody(removeResult.Errors);
            }

            var addResult = currentRoles.Contains(request.Role)
                ? IdentityResult.Success
                : await _userManager.AddToRoleAsync(user, request.Role);

            if (!addResult.Succeeded)
                return ServiceResult.BadRequestBody(addResult.Errors);

            // Same reasoning as the request-approval path: an admin promoting someone
            // to Judge here is promoting a department member, not an invited guest.
            if (request.Role == "Judge")
            {
                user.JudgeType = JudgeType.Internal;
                await _userManager.UpdateAsync(user);
            }

            // Invalidate the user's existing JWTs so the new role takes effect immediately
            // instead of lingering until the old token expires.
            await _userManager.UpdateSecurityStampAsync(user);

            await _auditLogService.LogAsync(
                actorUserId,
                "update_user_role",
                "User",
                user.Id.ToString(),
                $"Updated user {user.Email} role to {request.Role}.");

            return ServiceResult.Ok(new
            {
                message = "User role updated successfully.",
                userId = user.Id,
                role = request.Role
            });
        }

        public async Task<ServiceResult> DeleteUserAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
                return ServiceResult.NotFound("User not found.");

            var roles = await _userManager.GetRolesAsync(user);

            if (roles.Contains("Admin"))
                return ServiceResult.BadRequest("Cannot delete an Admin account.");

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            return ServiceResult.OkMessage("User deleted successfully.");
        }

        public async Task<ServiceResult> CreateGuestJudgeAsync(Guid? actorUserId, CreateGuestJudgeRequest request)
        {
            var existing = await _userManager.FindByEmailAsync(request.Email);
            if (existing != null)
                return ServiceResult.BadRequest("Email is already in use.");

            var tempPassword = "Judge@" + Guid.NewGuid().ToString("N").Substring(0, 8) + "1!";

            var user = new ApplicationUser
            {
                UserName = request.Email,
                Email = request.Email,
                FullName = request.Name,
                SchoolName = request.Company,
                IsApproved = true,
                CreatedAt = DateTime.UtcNow,
                // This endpoint exists only to create invited outside judges, so the
                // type is known here rather than guessed from the email domain later.
                JudgeType = JudgeType.Guest
            };

            var result = await _userManager.CreateAsync(user, tempPassword);
            if (!result.Succeeded)
                return ServiceResult.BadRequestBody(result.Errors);

            if (!await _roleManager.RoleExistsAsync("Judge"))
                await _roleManager.CreateAsync(new IdentityRole<Guid>("Judge"));

            await _userManager.AddToRoleAsync(user, "Judge");

            await _auditLogService.LogAsync(
                actorUserId,
                "create_guest_judge",
                "User",
                user.Id.ToString(),
                $"Created guest judge {user.Email}.");

            return ServiceResult.Ok(new
            {
                message = "Guest judge account created successfully.",
                email = user.Email,
                password = tempPassword
            });
        }

        public async Task<ServiceResult> GetRoleRequestsAsync()
        {
            var users = await _userManager.Users
                .Where(u => u.RequestedRole != null)
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            var roleMap = await GetRoleMapAsync(users.Select(u => u.Id));

            var result = users.Select(user => (object)new
            {
                user.Id,
                user.FullName,
                user.Email,
                studentType = user.StudentType == null ? null : user.StudentType.ToString(),
                user.StudentCode,
                user.SchoolName,
                user.CreatedAt,
                requestedRole = user.RequestedRole,
                roles = roleMap.TryGetValue(user.Id, out var r) ? r : new List<string>()
            }).ToList();

            return ServiceResult.Ok(result);
        }

        public async Task<ServiceResult> HandleRoleRequestAsync(Guid? actorUserId, Guid userId, bool approve)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                return ServiceResult.NotFound("User not found.");

            if (string.IsNullOrEmpty(user.RequestedRole))
                return ServiceResult.BadRequest("User has no pending role request.");

            var requestedRole = user.RequestedRole;

            if (approve)
            {
                if (requestedRole != "Mentor" && requestedRole != "Judge")
                    return ServiceResult.BadRequest("Invalid requested role.");

                if (!await _roleManager.RoleExistsAsync(requestedRole))
                    await _roleManager.CreateAsync(new IdentityRole<Guid>(requestedRole));

                // UserManager writes go straight to the database, one call at a time.
                // Without a transaction a failure between the strip and the grant would
                // leave the account with NO roles at all — locked out of every portal —
                // and an early return would keep that state. The transaction lets any
                // failed step roll the whole role swap back.
                // Retrying connections mean EF refuses a transaction opened by hand: a
                // retry has to replay the whole role swap, not resume half of one. The
                // rollback restores the original roles, so replaying lands on the same
                // end state. A non-null result means the swap was rejected outright.
                var strategy = _db.Database.CreateExecutionStrategy();
                var failure = await strategy.ExecuteAsync(async () =>
                {
                    await using var tx = await _db.Database.BeginTransactionAsync();

                    var currentRoles = await _userManager.GetRolesAsync(user);
                    var participantRoles = currentRoles.Where(role => role is "Member" or "TeamLeader").ToList();
                    if (participantRoles.Any())
                    {
                        var removeResult = await _userManager.RemoveFromRolesAsync(user, participantRoles);
                        if (!removeResult.Succeeded)
                        {
                            await tx.RollbackAsync();
                            return ServiceResult.BadRequestBody(removeResult.Errors);
                        }
                    }

                    var addResult = currentRoles.Contains(requestedRole)
                        ? IdentityResult.Success
                        : await _userManager.AddToRoleAsync(user, requestedRole);
                    if (!addResult.Succeeded)
                    {
                        await tx.RollbackAsync();
                        return ServiceResult.BadRequestBody(addResult.Errors);
                    }

                    // Judges granted through the in-house request flow are department
                    // people; invited outsiders come in via CreateGuestJudgeAsync
                    // instead. An admin can correct the odd exception on the user record.
                    if (requestedRole == "Judge")
                        user.JudgeType = JudgeType.Internal;

                    user.RequestedRole = null;
                    var updateResult = await _userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        await tx.RollbackAsync();
                        return ServiceResult.BadRequestBody(updateResult.Errors);
                    }

                    await _userManager.UpdateSecurityStampAsync(user);

                    await tx.CommitAsync();
                    return null;
                });

                if (failure != null)
                    return failure;

                await _notificationService.CreateAsync(
                    user.Id,
                    "Role Request Approved",
                    $"Your request to become a {requestedRole} has been approved.",
                    "role_request");

                await _auditLogService.LogAsync(
                    actorUserId,
                    "approve_role_request",
                    "User",
                    user.Id.ToString(),
                    $"Approved user {user.Email} request to become a {requestedRole}.");

                return ServiceResult.OkMessage($"User role request for {requestedRole} approved successfully.");
            }
            else
            {
                user.RequestedRole = null;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                    return ServiceResult.BadRequestBody(updateResult.Errors);

                await _notificationService.CreateAsync(
                    user.Id,
                    "Role Request Declined",
                    $"Your request to become a {requestedRole} has been declined.",
                    "role_request");

                await _auditLogService.LogAsync(
                    actorUserId,
                    "reject_role_request",
                    "User",
                    user.Id.ToString(),
                    $"Declined user {user.Email} request to become a {requestedRole}.");

                return ServiceResult.OkMessage($"User role request for {requestedRole} declined successfully.");
            }
        }

        public async Task<ServiceResult> GetRegisteredMentorsAsync(Guid eventId)
        {
            var eventItem = await _db.Events
                .Include(e => e.RegisteredMentors)
                .FirstOrDefaultAsync(e => e.EventId == eventId);

            if (eventItem == null) return ServiceResult.NotFound("Event not found.");

            var mentors = eventItem.RegisteredMentors.Select(u => (object)new
            {
                u.Id,
                u.FullName,
                u.Email,
                roles = new List<string> { "Mentor" },
                u.IsApproved,
                u.StudentCode,
                Company = u.SchoolName,
                studentType = u.StudentType?.ToString(),
                developerRole = u.DeveloperRole?.ToString(),
                u.CreatedAt
            }).ToList();

            return ServiceResult.Ok(mentors);
        }

        public async Task<ServiceResult> GetRegisteredJudgesAsync(Guid eventId)
        {
            var eventItem = await _db.Events
                .Include(e => e.RegisteredJudges)
                .FirstOrDefaultAsync(e => e.EventId == eventId);

            if (eventItem == null) return ServiceResult.NotFound("Event not found.");

            var judges = eventItem.RegisteredJudges.Select(u => (object)new
            {
                u.Id,
                u.FullName,
                u.Email,
                roles = new List<string> { "Judge" },
                u.IsApproved,
                u.StudentCode,
                Company = u.SchoolName,
                studentType = u.StudentType?.ToString(),
                developerRole = u.DeveloperRole?.ToString(),
                u.CreatedAt
            }).ToList();

            return ServiceResult.Ok(judges);
        }
    }
}
