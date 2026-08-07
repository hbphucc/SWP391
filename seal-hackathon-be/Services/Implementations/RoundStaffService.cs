using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.RoundStaff;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class RoundStaffService : IRoundStaffService
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public RoundStaffService(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<ServiceResult> GetAssignmentsAsync(Guid eventId)
        {
            var assignments = await _context.RoundStaffAssignments
                .Where(a => a.Round.EventId == eventId)
                .OrderBy(a => a.Round.RoundOrder)
                .ThenBy(a => a.Role)
                .ThenBy(a => a.User.FullName)
                .Select(a => new RoundStaffAssignmentDto
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    FullName = a.User.FullName,
                    Email = a.User.Email ?? string.Empty,
                    RoundId = a.RoundId,
                    RoundName = a.Round.RoundName,
                    Role = a.Role,
                    IsActive = a.IsActive
                })
                .ToListAsync();

            return ServiceResult.Ok(assignments);
        }

        public async Task<ServiceResult> AssignAsync(Guid? adminUserId, Guid userId, Guid roundId, RoundStaffRole role)
        {
            var round = await _context.Rounds.FindAsync(roundId);
            if (round == null) return ServiceResult.NotFound("Round not found.");

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null || !user.IsApproved) return ServiceResult.BadRequest("Staff user is not approved.");

            var isStaff = await _userManager.IsInRoleAsync(user, "Mentor") || await _userManager.IsInRoleAsync(user, "Judge") || await _userManager.IsInRoleAsync(user, "Admin");
            if (!isStaff)
                return ServiceResult.BadRequest("This user does not have a staff role (Mentor or Judge).");

            var roleName = role.ToString();
            if (!await _userManager.IsInRoleAsync(user, roleName))
            {
                await _userManager.AddToRoleAsync(user, roleName);
            }

            var registeredForEvent = await _context.Events
                .Where(e => e.EventId == round.EventId)
                .AnyAsync(e => e.RegisteredMentors.Any(u => u.Id == userId) || e.RegisteredJudges.Any(u => u.Id == userId));
            if (!registeredForEvent)
                return ServiceResult.BadRequest("Staff must be registered for this event before being assigned to a round.");

            var existing = await _context.RoundStaffAssignments
                .FirstOrDefaultAsync(a => a.UserId == userId && a.RoundId == roundId && a.Role == role);
            if (existing != null)
            {
                if (existing.IsActive) return ServiceResult.OkMessage("Staff member is already on this round roster.");
                existing.IsActive = true;
                existing.AssignedByUserId = adminUserId;
                existing.AssignedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return ServiceResult.OkMessage("Staff member restored to the round roster.");
            }

            _context.RoundStaffAssignments.Add(new RoundStaffAssignment
            {
                UserId = userId,
                RoundId = roundId,
                Role = role,
                AssignedByUserId = adminUserId
            });
            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Staff member added to the round roster.");
        }

        public async Task<ServiceResult> DeactivateAsync(Guid id)
        {
            var assignment = await _context.RoundStaffAssignments.FindAsync(id);
            if (assignment == null) return ServiceResult.NotFound("Round staff assignment not found.");
            if (!assignment.IsActive) return ServiceResult.BadRequest("Round staff assignment is already inactive.");

            assignment.IsActive = false;

            if (assignment.Role == RoundStaffRole.Mentor)
            {
                var mentorAssignments = await _context.MentorAssignments
                    .Where(a => a.MentorUserId == assignment.UserId
                                && a.RoundId == assignment.RoundId
                                && a.IsActive)
                    .ToListAsync();

                foreach (var mentorAssignment in mentorAssignments)
                {
                    mentorAssignment.IsActive = false;
                    mentorAssignment.Status = InvitationStatus.Cancelled;
                }
            }
            else
            {
                var judgeAssignments = await _context.JudgeAssignments
                    .Where(a => a.JudgeId == assignment.UserId && a.RoundId == assignment.RoundId)
                    .ToListAsync();

                _context.JudgeAssignments.RemoveRange(judgeAssignments);
            }

            await _context.SaveChangesAsync();
            return ServiceResult.OkMessage("Staff member removed from the round roster.");
        }
    }
}
