using Microsoft.EntityFrameworkCore;
using SEAL.NET.Data;
using SEAL.NET.DTOs.Team;
using SEAL.NET.Models.Entities;
using SEAL.NET.Models.Enums;
using SEAL.NET.Services.Common;
using SEAL.NET.Services.Interfaces;

namespace SEAL.NET.Services.Implementations
{
    public class MentorAdminService : IMentorAdminService
    {
        private readonly ApplicationDbContext _context;

        public MentorAdminService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResult> GetAssignmentsAsync(Guid? eventId = null)
        {
            var assignments = await _context.MentorAssignments
                .Include(ma => ma.Mentor)
                .Include(ma => ma.Team).ThenInclude(t => t.Category)
                .Include(ma => ma.AssignedBy)
                .Where(ma => eventId == null || ma.Team.Category.EventId == eventId)
                .OrderByDescending(ma => ma.AssignedAt)
                .Select(ma => new MentorAssignmentResponseDto
                {
                    Id = ma.Id,
                    MentorUserId = ma.MentorUserId,
                    MentorName = ma.Mentor.FullName,
                    MentorEmail = ma.Mentor.Email ?? string.Empty,
                    TeamId = ma.TeamId,
                    TeamName = ma.Team.TeamName,
                    AssignedByName = ma.AssignedBy != null ? ma.AssignedBy.FullName : "System",
                    AssignedAt = ma.AssignedAt,
                    IsActive = ma.IsActive,
                    Status = ma.Status.ToString()
                })
                .ToListAsync();

            return ServiceResult.Ok(assignments);
        }

        public async Task<ServiceResult> AssignMentorAsync(Guid? adminUserId, Guid mentorUserId, Guid teamId)
        {
            var team = await _context.Teams.FirstOrDefaultAsync(t => t.TeamId == teamId);
            if (team == null)
                return ServiceResult.NotFound("Team not found.");

            var mentor = await _context.Users.FirstOrDefaultAsync(u => u.Id == mentorUserId);
            if (mentor == null)
                return ServiceResult.NotFound("Mentor user not found.");

            var existingActive = await _context.MentorAssignments
                .Where(ma => ma.TeamId == teamId && (ma.IsActive || ma.Status == InvitationStatus.Pending))
                .ToListAsync();

            foreach (var existing in existingActive)
            {
                existing.IsActive = false;
                existing.Status = InvitationStatus.Cancelled;
            }

            var newAssignment = new MentorAssignment
            {
                TeamId = teamId,
                MentorUserId = mentorUserId,
                AssignedByUserId = adminUserId,
                Status = InvitationStatus.Accepted,
                IsActive = true,
                AssignedAt = DateTime.UtcNow
            };

            _context.MentorAssignments.Add(newAssignment);
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Mentor assigned to team successfully.");
        }

        public async Task<ServiceResult> DeactivateAssignmentAsync(Guid id)
        {
            var assignment = await _context.MentorAssignments.FirstOrDefaultAsync(ma => ma.Id == id);
            if (assignment == null)
                return ServiceResult.NotFound("Assignment not found.");

            if (!assignment.IsActive)
                return ServiceResult.BadRequest("Assignment is already inactive.");

            assignment.IsActive = false;
            assignment.Status = InvitationStatus.Cancelled;
            await _context.SaveChangesAsync();

            return ServiceResult.OkMessage("Assignment deactivated successfully.");
        }
    }
}
